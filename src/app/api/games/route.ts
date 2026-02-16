import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import jwt from 'jsonwebtoken';
import { GameVariant } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper to get user from token
async function getUserFromToken(request: Request): Promise<{ userId: number; username: string } | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; username: string };
    return decoded;
  } catch {
    return null;
  }
}

// Default settings for each variant
const DEFAULT_SETTINGS: Record<GameVariant, any> = {
  taiwan: {
    baseScore: 100,
    taiScore: 100,
    dealerBonus: 1,
    maxPlayers: 4,
    autoScore: true,
    doorDiceDouble: true,
  },
  japanese: {
    startPoints: 25000,
    returnPoints: 30000,
    umaPoints: [15000, 5000, -5000, -15000],
    notenPenalty: 1000,
    maxPlayers: 4,
    autoScore: true,
  },
  hongkong: {
    baseScore: 1,
    fullLiability: true,
    selfDrawMultiplier: 2,
    jackpotEnabled: false,
    maxPlayers: 4,
    autoScore: true,
  },
  'hk-taiwan': {
    baseScore: 2,
    taiScore: 1,
    dealerBonus: 1,
    maxPlayers: 4,
    autoScore: true,
    doorDiceDouble: false,
  },
  paoma: {
    baseScore: 1,
    maxPlayers: 4,
    autoScore: true,
    jackpotEnabled: true,
  },
};

// GET /api/games - List all games (with optional search/filter)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const variant = searchParams.get('variant');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        g.*,
        u.username as owner_username,
        COUNT(gp.player_id) as player_count,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', p.id,
              'name', p.name,
              'seat_position', gp.seat_position,
              'final_score', gp.final_score,
              'is_dealer', gp.is_dealer,
              'wins', gp.wins,
              'self_draws', gp.self_draws,
              'deal_ins', gp.deal_ins
            ) ORDER BY gp.seat_position
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) as players
      FROM games g
      LEFT JOIN users u ON g.user_id = u.id
      LEFT JOIN game_players gp ON g.id = gp.game_id
      LEFT JOIN players p ON gp.player_id = p.id
      WHERE (g.is_public = TRUE OR g.user_id = $1)
    `;
    
    const params: any[] = [userId || null];
    let paramIndex = 2;
    
    if (search) {
      query += ` AND (g.name ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (variant) {
      query += ` AND g.variant = $${paramIndex}`;
      params.push(variant);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND g.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (userId) {
      query += ` AND g.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }
    
    query += ` GROUP BY g.id, u.username ORDER BY g.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM games g WHERE (g.is_public = TRUE OR g.user_id = $1)';
    const countParams: any[] = [userId || null];
    let countIndex = 2;
    
    if (search) {
      countQuery += ` AND (g.name ILIKE $${countIndex})`;
      countParams.push(`%${search}%`);
      countIndex++;
    }
    if (variant) {
      countQuery += ` AND g.variant = $${countIndex}`;
      countParams.push(variant);
      countIndex++;
    }
    if (status) {
      countQuery += ` AND g.status = $${countIndex}`;
      countParams.push(status);
      countIndex++;
    }
    if (userId) {
      countQuery += ` AND g.user_id = $${countIndex}`;
      countParams.push(userId);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    return NextResponse.json({
      games: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// POST /api/games - Create new game (requires auth)
export async function POST(request: Request) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const { name, variant, playerIds, customSettings, isPublic = true } = await request.json();
    
    if (!name || !playerIds || playerIds.length < 3) {
      return NextResponse.json({ error: 'Invalid game data' }, { status: 400 });
    }
    
    // Merge default settings with custom settings
    const settings = {
      ...DEFAULT_SETTINGS[variant as GameVariant],
      ...customSettings,
    };
    
    // Create game with user_id
    const gameResult = await pool.query(
      `INSERT INTO games (user_id, name, variant, settings, current_wind, is_public) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user.userId, name, variant, JSON.stringify(settings), '東', isPublic]
    );
    const gameId = gameResult.rows[0].id;
    
    // Add players to game with positions
    for (let i = 0; i < playerIds.length; i++) {
      const playerId = playerIds[i];
      const isDealer = i === 0;
      
      await pool.query(
        `INSERT INTO game_players (game_id, player_id, seat_position, is_dealer, final_score) 
         VALUES ($1, $2, $3, $4, $5)`,
        [gameId, playerId, i + 1, isDealer, settings.startPoints || 0]
      );
    }
    
    return NextResponse.json(gameResult.rows[0]);
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// PUT /api/games - Update game (requires auth)
export async function PUT(request: Request) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const { id, status, settings, is_public } = await request.json();
    
    // Verify ownership
    const gameCheck = await pool.query(
      'SELECT user_id FROM games WHERE id = $1',
      [id]
    );
    
    if (gameCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    if (gameCheck.rows[0].user_id !== user.userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
      if (status === 'completed') {
        updates.push(`completed_at = CURRENT_TIMESTAMP`);
      }
    }
    
    if (settings) {
      updates.push(`settings = $${paramIndex++}`);
      values.push(JSON.stringify(settings));
    }
    
    if (is_public !== undefined) {
      updates.push(`is_public = $${paramIndex++}`);
      values.push(is_public);
    }
    
    values.push(id);
    
    const result = await pool.query(
      `UPDATE games SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
