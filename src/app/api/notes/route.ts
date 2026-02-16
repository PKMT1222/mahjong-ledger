import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/notes - Get all notes with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const gameId = searchParams.get('gameId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const handType = searchParams.get('handType');
    
    let query = `
      SELECT 
        hn.*,
        p.name as player_name,
        g.name as game_name,
        g.created_at as game_date,
        r.round_number,
        r.round_wind
      FROM hand_notes hn
      JOIN players p ON hn.player_id = p.id
      JOIN games g ON hn.game_id = g.id
      JOIN rounds r ON hn.round_id = r.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (playerId) {
      query += ` AND hn.player_id = $${paramIndex++}`;
      params.push(playerId);
    }
    
    if (gameId) {
      query += ` AND hn.game_id = $${paramIndex++}`;
      params.push(gameId);
    }
    
    if (startDate) {
      query += ` AND g.created_at >= $${paramIndex++}`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND g.created_at <= $${paramIndex++}`;
      params.push(endDate);
    }
    
    if (handType) {
      query += ` AND hn.hand_type = $${paramIndex++}`;
      params.push(handType);
    }
    
    query += ` ORDER BY g.created_at DESC, r.round_number DESC`;
    
    const result = await pool.query(query, params);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// POST /api/notes - Create a new hand note
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      round_id,
      game_id,
      player_id,
      hand_type,
      hand_tiles,
      winning_tile,
      is_self_draw,
      is_dealer,
      fan_count,
      score,
      notes,
      mood,
      location,
      tags
    } = body;
    
    const result = await pool.query(
      `INSERT INTO hand_notes (
        round_id, game_id, player_id, hand_type, hand_tiles, winning_tile,
        is_self_draw, is_dealer, fan_count, score, notes, mood, location, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        round_id, game_id, player_id, hand_type, 
        JSON.stringify(hand_tiles || []), winning_tile,
        is_self_draw, is_dealer, fan_count, score, notes, mood, location,
        JSON.stringify(tags || [])
      ]
    );
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
