import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { GameVariant, GameSettings } from '@/types';

// Default settings for each variant
const DEFAULT_SETTINGS: Record<GameVariant, GameSettings> = {
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

// GET /api/games - List all games
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        g.*,
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
      LEFT JOIN game_players gp ON g.id = gp.game_id
      LEFT JOIN players p ON gp.player_id = p.id
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// POST /api/games - Create new game
export async function POST(request: Request) {
  try {
    const { name, variant, playerIds, customSettings } = await request.json();
    
    // Merge default settings with custom settings
    const settings = {
      ...DEFAULT_SETTINGS[variant as GameVariant],
      ...customSettings,
    };
    
    // Create game
    const gameResult = await pool.query(
      `INSERT INTO games (name, variant, settings, current_wind) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, variant, JSON.stringify(settings), '東']
    );
    const gameId = gameResult.rows[0].id;
    
    // Add players to game with positions
    for (let i = 0; i < playerIds.length; i++) {
      const playerId = playerIds[i];
      const isDealer = i === 0; // First player is dealer (East)
      
      await pool.query(
        `INSERT INTO game_players (game_id, player_id, seat_position, is_dealer, final_score) 
         VALUES ($1, $2, $3, $4, $5)`,
        [gameId, playerId, i + 1, isDealer, settings.startPoints || 0]
      );
    }
    
    return NextResponse.json(gameResult.rows[0]);
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// PUT /api/games/[id] - Update game
export async function PUT(request: Request) {
  try {
    const { id, status, settings } = await request.json();
    
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
