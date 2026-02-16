import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/stats/comprehensive - Get comprehensive statistics
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    
    // Base query for completed games
    const baseQuery = `
      FROM games g
      LEFT JOIN game_players gp ON g.id = gp.game_id
      LEFT JOIN players p ON gp.player_id = p.id
      LEFT JOIN rounds r ON g.id = r.game_id
      WHERE g.status = 'completed'
    `;
    
    // 1. Global Overview Stats
    const globalStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT g.id) as total_games,
        COUNT(DISTINCT r.id) as total_rounds,
        COALESCE(SUM(gp.final_score), 0) as total_money_exchanged,
        COALESCE(AVG(gp.final_score), 0) as avg_score_per_player,
        COUNT(DISTINCT gp.player_id) as total_players
      ${baseQuery}
    `);
    
    // 2. Top Hand Types (from hand_notes)
    const topHandTypes = await pool.query(`
      SELECT 
        COALESCE(hn.hand_type, hn.custom_name, '未知牌型') as hand_type,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
      FROM hand_notes hn
      JOIN games g ON hn.game_id = g.id
      WHERE g.status = 'completed'
        AND EXTRACT(YEAR FROM hn.created_at) = $1
      GROUP BY COALESCE(hn.hand_type, hn.custom_name, '未知牌型')
      ORDER BY count DESC
      LIMIT 5
    `, [year]);
    
    // 3. Player Rankings
    const playerRankings = await pool.query(`
      SELECT 
        p.id,
        p.name,
        COUNT(DISTINCT gp.game_id) as games_played,
        COALESCE(SUM(gp.final_score), 0) as total_score,
        COALESCE(SUM(gp.wins), 0) as total_wins,
        COALESCE(SUM(gp.self_draws), 0) as total_self_draws,
        COALESCE(SUM(gp.deal_ins), 0) as total_deal_ins,
        ROUND(COALESCE(SUM(gp.wins), 0) * 100.0 / NULLIF(COUNT(DISTINCT r.id), 0), 1) as win_rate,
        RANK() OVER (ORDER BY COALESCE(SUM(gp.final_score), 0) DESC) as rank_by_money,
        RANK() OVER (ORDER BY COALESCE(SUM(gp.self_draws), 0) DESC) as rank_by_self_draws,
        RANK() OVER (ORDER BY COALESCE(SUM(gp.deal_ins), 0) DESC) as rank_by_deal_ins
      FROM players p
      LEFT JOIN game_players gp ON p.id = gp.player_id
      LEFT JOIN games g ON gp.game_id = g.id AND g.status = 'completed'
      LEFT JOIN rounds r ON g.id = r.game_id AND $1 = ANY(r.winner_ids)
      WHERE g.status = 'completed' OR g.status IS NULL
      GROUP BY p.id, p.name
      HAVING COUNT(DISTINCT gp.game_id) > 0
      ORDER BY total_score DESC
    `);
    
    // 4. Monthly Trend
    const monthlyTrend = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', g.completed_at), 'YYYY-MM') as month,
        COUNT(DISTINCT g.id) as games_count,
        COUNT(DISTINCT r.id) as rounds_count,
        COALESCE(SUM(gp.final_score) FILTER (WHERE gp.final_score > 0), 0) as total_winnings
      FROM games g
      LEFT JOIN game_players gp ON g.id = gp.game_id
      LEFT JOIN rounds r ON g.id = r.game_id
      WHERE g.status = 'completed'
        AND EXTRACT(YEAR FROM g.completed_at) = $1
      GROUP BY DATE_TRUNC('month', g.completed_at)
      ORDER BY month
    `, [year]);
    
    // 5. Player-specific stats if playerId provided
    let playerStats = null;
    if (playerId) {
      // Basic player stats
      const basicStats = await pool.query(`
        SELECT 
          p.id,
          p.name,
          COUNT(DISTINCT gp.game_id) as total_games,
          COALESCE(SUM(gp.final_score), 0) as total_score,
          COALESCE(SUM(gp.wins), 0) as total_wins,
          COALESCE(SUM(gp.self_draws), 0) as total_self_draws,
          COALESCE(SUM(gp.deal_ins), 0) as total_deal_ins,
          COALESCE(AVG(gp.final_score), 0) as avg_score,
          ROUND(COALESCE(SUM(gp.self_draws), 0) * 100.0 / NULLIF(COALESCE(SUM(gp.wins), 0), 0), 1) as self_draw_rate,
          ROUND(COALESCE(SUM(gp.deal_ins), 0) * 100.0 / NULLIF(COUNT(DISTINCT gp.game_id), 0), 1) as deal_in_rate
        FROM players p
        LEFT JOIN game_players gp ON p.id = gp.player_id
        LEFT JOIN games g ON gp.game_id = g.id AND g.status = 'completed'
        WHERE p.id = $1
        GROUP BY p.id, p.name
      `, [playerId]);
      
      // Player's favorite hands
      const favoriteHands = await pool.query(`
        SELECT 
          COALESCE(hn.hand_type, hn.custom_name, '未知牌型') as hand_type,
          COUNT(*) as count,
          COALESCE(SUM(hn.fan_count), 0) as total_fan
        FROM hand_notes hn
        JOIN games g ON hn.game_id = g.id
        WHERE hn.player_id = $1
          AND g.status = 'completed'
        GROUP BY COALESCE(hn.hand_type, hn.custom_name, '未知牌型')
        ORDER BY count DESC
        LIMIT 5
      `, [playerId]);
      
      // Player's monthly trend
      const playerMonthlyTrend = await pool.query(`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', g.completed_at), 'YYYY-MM') as month,
          COUNT(DISTINCT g.id) as games_count,
          COALESCE(SUM(gp.final_score), 0) as monthly_score,
          COALESCE(SUM(gp.wins), 0) as monthly_wins
        FROM games g
        JOIN game_players gp ON g.id = gp.game_id
        WHERE gp.player_id = $1
          AND g.status = 'completed'
          AND EXTRACT(YEAR FROM g.completed_at) = $2
        GROUP BY DATE_TRUNC('month', g.completed_at)
        ORDER BY month
      `, [playerId, year]);
      
      // Head-to-head stats
      const headToHead = await pool.query(`
        WITH player_games AS (
          SELECT DISTINCT game_id
          FROM game_players
          WHERE player_id = $1
        ),
        opponent_results AS (
          SELECT 
            p.name as opponent_name,
            p.id as opponent_id,
            COUNT(*) as games_together,
            SUM(CASE WHEN gp.final_score > op.final_score THEN 1 ELSE 0 END) as wins_against,
            SUM(CASE WHEN gp.final_score < op.final_score THEN 1 ELSE 0 END) as losses_to
          FROM player_games pg
          JOIN game_players gp ON pg.game_id = gp.game_id AND gp.player_id = $1
          JOIN game_players op ON pg.game_id = op.game_id AND op.player_id != $1
          JOIN players p ON op.player_id = p.id
          JOIN games g ON pg.game_id = g.id
          WHERE g.status = 'completed'
          GROUP BY p.id, p.name
        )
        SELECT *,
          ROUND(wins_against * 100.0 / games_together, 1) as win_rate
        FROM opponent_results
        ORDER BY games_together DESC
        LIMIT 10
      `, [playerId]);
      
      playerStats = {
        basic: basicStats.rows[0],
        favoriteHands: favoriteHands.rows,
        monthlyTrend: playerMonthlyTrend.rows,
        headToHead: headToHead.rows
      };
    }
    
    // 6. Yearly summary
    const yearlySummary = await pool.query(`
      SELECT 
        EXTRACT(YEAR FROM g.completed_at) as year,
        COUNT(DISTINCT g.id) as total_games,
        COUNT(DISTINCT r.id) as total_rounds,
        COALESCE(SUM(gp.final_score) FILTER (WHERE gp.final_score > 0), 0) as total_winnings
      FROM games g
      LEFT JOIN game_players gp ON g.id = gp.game_id
      LEFT JOIN rounds r ON g.id = r.game_id
      WHERE g.status = 'completed'
      GROUP BY EXTRACT(YEAR FROM g.completed_at)
      ORDER BY year DESC
      LIMIT 5
    `);
    
    return NextResponse.json({
      global: globalStats.rows[0],
      topHandTypes: topHandTypes.rows,
      playerRankings: playerRankings.rows,
      monthlyTrend: monthlyTrend.rows,
      playerStats,
      yearlySummary: yearlySummary.rows,
      currentYear: year
    });
    
  } catch (error) {
    console.error('Comprehensive stats error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
