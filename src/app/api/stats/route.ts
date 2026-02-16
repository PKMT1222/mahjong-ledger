import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/stats?playerId=1 or /api/stats (all players)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const gameId = searchParams.get('gameId');
    
    if (gameId) {
      // Get stats for a specific game
      const result = await pool.query(`
        SELECT 
          gp.*,
          p.name,
          COUNT(r.id) as rounds_played,
          SUM(CASE WHEN $1 = ANY(r.winner_ids) THEN 1 ELSE 0 END) as total_wins
        FROM game_players gp
        JOIN players p ON gp.player_id = p.id
        LEFT JOIN rounds r ON r.game_id = gp.game_id
        WHERE gp.game_id = $1
        GROUP BY gp.id, p.name
        ORDER BY gp.final_score DESC
      `, [gameId]);
      
      // Calculate titles
      const players = result.rows;
      const titles: { [key: number]: string[] } = {};
      
      // Winning king (most wins)
      const winKing = players.reduce((max, p) => p.wins > max.wins ? p : max, players[0]);
      if (winKing) titles[winKing.player_id] = [...(titles[winKing.player_id] || []), '🏆 食糊王'];
      
      // Self-draw king
      const drawKing = players.reduce((max, p) => p.self_draws > max.self_draws ? p : max, players[0]);
      if (drawKing) titles[drawKing.player_id] = [...(titles[drawKing.player_id] || []), '🎯 自摸王'];
      
      // Deal-in king (most deal-ins - bad)
      const dealKing = players.reduce((max, p) => p.deal_ins > max.deal_ins ? p : max, players[0]);
      if (dealKing) titles[dealKing.player_id] = [...(titles[dealKing.player_id] || []), '💥 出統王'];
      
      return NextResponse.json({ players, titles });
    }
    
    if (playerId) {
      // Get stats for specific player across all games
      const result = await pool.query(`
        SELECT 
          p.*,
          COUNT(DISTINCT gp.game_id) as total_games,
          SUM(gp.final_score) as total_score,
          SUM(gp.wins) as total_wins,
          SUM(gp.self_draws) as total_self_draws,
          SUM(gp.deal_ins) as total_deal_ins,
          AVG(gp.final_score) as avg_score
        FROM players p
        LEFT JOIN game_players gp ON p.id = gp.player_id
        WHERE p.id = $1
        GROUP BY p.id
      `, [playerId]);
      
      return NextResponse.json(result.rows[0]);
    }
    
    // Get all player stats
    const result = await pool.query(`
      SELECT 
        p.*,
        COUNT(DISTINCT gp.game_id) as total_games,
        COALESCE(SUM(gp.final_score), 0) as total_score,
        COALESCE(SUM(gp.wins), 0) as total_wins,
        COALESCE(SUM(gp.self_draws), 0) as total_self_draws,
        COALESCE(SUM(gp.deal_ins), 0) as total_deal_ins,
        COALESCE(AVG(gp.final_score), 0) as avg_score
      FROM players p
      LEFT JOIN game_players gp ON p.id = gp.player_id
      GROUP BY p.id
      ORDER BY total_score DESC
    `);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
