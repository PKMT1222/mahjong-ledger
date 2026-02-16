import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/games - List all games
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT g.*, 
        COUNT(gp.player_id) as player_count,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', p.id,
            'name', p.name,
            'final_score', gp.final_score
          )
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
    const { name, playerIds } = await request.json();
    
    // Create game
    const gameResult = await pool.query(
      'INSERT INTO games (name) VALUES ($1) RETURNING *',
      [name]
    );
    const gameId = gameResult.rows[0].id;
    
    // Add players to game
    for (const playerId of playerIds) {
      await pool.query(
        'INSERT INTO game_players (game_id, player_id) VALUES ($1, $2)',
        [gameId, playerId]
      );
    }
    
    return NextResponse.json(gameResult.rows[0]);
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
