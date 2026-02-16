import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST /api/games/[id]/undo - Undo last round
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get last history entry
    const historyResult = await pool.query(
      'SELECT * FROM game_history WHERE game_id = $1 AND action_type = $2 ORDER BY created_at DESC LIMIT 1',
      [id, 'ADD_ROUND']
    );
    
    if (historyResult.rows.length === 0) {
      return NextResponse.json({ error: 'No rounds to undo' }, { status: 400 });
    }
    
    const historyEntry = historyResult.rows[0];
    const actionData = JSON.parse(historyEntry.action_data);
    const { roundId, scores } = actionData;
    
    // Reverse scores
    for (const [playerId, scoreChange] of Object.entries(scores)) {
      await pool.query(
        'UPDATE game_players SET final_score = final_score - $1 WHERE game_id = $2 AND player_id = $3',
        [scoreChange, id, parseInt(playerId)]
      );
    }
    
    // Delete round
    await pool.query('DELETE FROM rounds WHERE id = $1', [roundId]);
    await pool.query('DELETE FROM round_hands WHERE round_id = $1', [roundId]);
    
    // Delete history entry
    await pool.query('DELETE FROM game_history WHERE id = $1', [historyEntry.id]);
    
    // Update game round counter
    await pool.query(
      'UPDATE games SET current_round = current_round - 1 WHERE id = $1',
      [id]
    );
    
    return NextResponse.json({ success: true, message: 'Round undone' });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
