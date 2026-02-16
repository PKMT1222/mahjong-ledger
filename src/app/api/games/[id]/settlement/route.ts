import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/games/[id]/settlement - Calculate final settlement
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get game and players
    const gameResult = await pool.query(`
      SELECT g.*, g.settings
      FROM games g
      WHERE g.id = $1
    `, [id]);
    
    if (gameResult.rows.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    const game = gameResult.rows[0];
    const settings = JSON.parse(game.settings || '{}');
    
    // Get all players with final scores
    const playersResult = await pool.query(`
      SELECT 
        gp.player_id,
        p.name,
        gp.final_score,
        gp.seat_position,
        gp.wins,
        gp.self_draws,
        gp.deal_ins
      FROM game_players gp
      JOIN players p ON gp.player_id = p.id
      WHERE gp.game_id = $1
      ORDER BY gp.final_score DESC
    `, [id]);
    
    const players = playersResult.rows;
    const baseScore = settings.baseScore || 1;
    
    // Calculate settlements
    // Winners (positive score) receive money from losers (negative score)
    const settlements: any[] = [];
    const winners = players.filter((p: any) => p.final_score > 0);
    const losers = players.filter((p: any) => p.final_score < 0);
    
    // For each winner, calculate how much they should receive
    for (const winner of winners) {
      let remainingToCollect = winner.final_score * baseScore;
      
      for (const loser of losers) {
        if (remainingToCollect <= 0) break;
        
        const loserDebt = Math.abs(loser.final_score) * baseScore;
        const amount = Math.min(remainingToCollect, loserDebt);
        
        if (amount > 0) {
          settlements.push({
            from: loser.name,
            from_id: loser.player_id,
            to: winner.name,
            to_id: winner.player_id,
            amount: amount,
          });
          remainingToCollect -= amount;
        }
      }
    }
    
    return NextResponse.json({
      game: {
        id: game.id,
        name: game.name,
        variant: game.variant,
        status: game.status,
      },
      players,
      baseScore,
      settlements,
      summary: players.map((p: any) => ({
        name: p.name,
        score: p.final_score,
        amount: p.final_score * baseScore,
        isWinner: p.final_score > 0,
      })),
    });
  } catch (error) {
    console.error('Settlement calculation error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
