import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/games/[id]/rounds - Get rounds for a game
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await pool.query(`
      SELECT r.*,
        d.name as dealer_name,
        w.name as winner_name,
        l.name as loser_name
      FROM rounds r
      LEFT JOIN players d ON r.dealer_id = d.id
      LEFT JOIN players w ON r.winner_id = w.id
      LEFT JOIN players l ON r.loser_id = l.id
      WHERE r.game_id = $1
      ORDER BY r.round_number
    `, [id]);
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// POST /api/games/[id]/rounds - Add round to game
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { dealer_id, winner_id, loser_id, hand_type, points } = await request.json();
    
    // Get next round number
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM rounds WHERE game_id = $1',
      [id]
    );
    const roundNumber = parseInt(countResult.rows[0].count) + 1;
    
    // Create round
    const result = await pool.query(
      `INSERT INTO rounds (game_id, round_number, dealer_id, winner_id, loser_id, hand_type, points)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, roundNumber, dealer_id, winner_id, loser_id, hand_type, points]
    );
    
    // Update player scores
    if (winner_id && loser_id && points) {
      // Winner gains points
      await pool.query(
        'UPDATE game_players SET final_score = final_score + $1 WHERE game_id = $2 AND player_id = $3',
        [points, id, winner_id]
      );
      // Loser loses points
      await pool.query(
        'UPDATE game_players SET final_score = final_score - $1 WHERE game_id = $2 AND player_id = $3',
        [points, id, loser_id]
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
