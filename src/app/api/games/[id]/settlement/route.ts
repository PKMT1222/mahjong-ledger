import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/games/[id]/settlement - Calculate final settlement
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get game and settings
    const gameResult = await pool.query(
      'SELECT variant, settings FROM games WHERE id = $1',
      [id]
    );
    const game = gameResult.rows[0];
    const settings = JSON.parse(game.settings);
    
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
    
    // Calculate settlements based on variant
    const settlements: any[] = [];
    
    if (game.variant === 'japanese') {
      // Japanese: settle against return points
      const returnPoints = settings.returnPoints || 30000;
      const umaPoints = settings.umaPoints || [15000, 5000, -5000, -15000];
      
      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const diff = player.final_score - returnPoints;
        const uma = umaPoints[i] || 0;
        const final = Math.round((diff + uma) / 1000); // Convert to points
        
        settlements.push({
          ...player,
          raw_score: player.final_score,
          diff_from_return: diff,
          uma: uma,
          final_settlement: final,
          rank: i + 1
        });
      }
    } else {
      // Other variants: simple ranking
      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        settlements.push({
          ...player,
          final_settlement: player.final_score,
          rank: i + 1
        });
      }
    }
    
    // Calculate who pays whom
    const transactions: any[] = [];
    for (const winner of settlements.filter(s => s.final_settlement > 0)) {
      for (const loser of settlements.filter(s => s.final_settlement < 0)) {
        // This is simplified - actual calculation would be more complex
        transactions.push({
          from: loser.name,
          to: winner.name,
          amount: Math.min(winner.final_settlement, Math.abs(loser.final_settlement))
        });
      }
    }
    
    return NextResponse.json({
      variant: game.variant,
      settings,
      settlements,
      transactions
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
