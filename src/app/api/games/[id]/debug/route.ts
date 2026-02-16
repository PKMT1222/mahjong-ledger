import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if game exists
    const gameResult = await pool.query('SELECT * FROM games WHERE id = $1', [id]);
    if (gameResult.rows.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    // Check if rounds table exists and has data
    const roundsResult = await pool.query('SELECT COUNT(*) as count FROM rounds WHERE game_id = $1', [id]);
    
    // Check game_players
    const playersResult = await pool.query('SELECT * FROM game_players WHERE game_id = $1', [id]);
    
    return NextResponse.json({
      game: gameResult.rows[0],
      rounds_count: parseInt(roundsResult.rows[0].count),
      players: playersResult.rows,
      status: 'ok'
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Simple test insert
    const testResult = await pool.query(
      `INSERT INTO rounds (game_id, round_number, round_wind, hand_number, dealer_id, dealer_position, 
       winner_ids, is_self_draw, hand_type, base_tai, total_points, player_scores) 
       VALUES ($1, 1, '東', 1, 1, 1, ARRAY[1], false, '測試', 3, 10, '{}') 
       RETURNING *`,
      [id]
    );
    
    return NextResponse.json({
      success: true,
      inserted: testResult.rows[0]
    });
  } catch (error) {
    console.error('Test insert error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
