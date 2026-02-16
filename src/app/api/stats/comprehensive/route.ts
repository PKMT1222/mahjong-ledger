import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/stats/comprehensive - Get comprehensive statistics
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    
    // 1. Global Overview Stats (simplified, no date filtering)
    const globalStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT g.id) as total_games,
        COUNT(DISTINCT r.id) as total_rounds,
        COALESCE(SUM(gp.final_score), 0) as total_money_exchanged,
        COALESCE(AVG(gp.final_score), 0) as avg_score_per_player,
        COUNT(DISTINCT gp.player_id) as total_players
      FROM games g
      LEFT JOIN game_players gp ON g.id = gp.game_id
      LEFT JOIN rounds r ON g.id = r.game_id
      WHERE g.status = 'completed'
    `);
    
    // 2. Top Hand Types (simplified)
    let topHandTypes = { rows: [] };
    try {
      topHandTypes = await pool.query(`
        SELECT 
          COALESCE(hn.hand_type, hn.custom_name, '未知牌型') as hand_type,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER(), 0), 1) as percentage
        FROM hand_notes hn
        JOIN games g ON hn.game_id = g.id
        WHERE g.status = 'completed'
        GROUP BY COALESCE(hn.hand_type, hn.custom_name, '未知牌型')
        ORDER BY count DESC
        LIMIT 5
      `);
    } catch (e) {
      console.log('hand_notes query failed, may be empty');
    }
    
    // 3. Player Rankings (simplified)
    const playerRankings = await pool.query(`
      SELECT 
        p.id,
        p.name,
        COUNT(DISTINCT gp.game_id) as games_played,
        COALESCE(SUM(gp.final_score), 0) as total_score,
        COALESCE(SUM(gp.wins), 0) as total_wins,
        COALESCE(SUM(gp.self_draws), 0) as total_self_draws,
        COALESCE(SUM(gp.deal_ins), 0) as total_deal_ins
      FROM players p
      LEFT JOIN game_players gp ON p.id = gp.player_id
      LEFT JOIN games g ON gp.game_id = g.id AND g.status = 'completed'
      GROUP BY p.id, p.name
      HAVING COUNT(DISTINCT gp.game_id) > 0
      ORDER BY total_score DESC
    `);
    
    // 4. Monthly Trend (use created_at instead of completed_at)
    let monthlyTrend = { rows: [] };
    try {
      monthlyTrend = await pool.query(`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', g.created_at), 'YYYY-MM') as month,
          COUNT(DISTINCT g.id) as games_count,
          COUNT(DISTINCT r.id) as rounds_count
        FROM games g
        LEFT JOIN rounds r ON g.id = r.game_id
        WHERE g.status = 'completed'
          AND EXTRACT(YEAR FROM g.created_at) = $1
        GROUP BY DATE_TRUNC('month', g.created_at)
        ORDER BY month
      `, [year]);
    } catch (e) {
      console.log('Monthly trend query failed');
    }
    
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
          COALESCE(AVG(gp.final_score), 0) as avg_score
        FROM players p
        LEFT JOIN game_players gp ON p.id = gp.player_id
        LEFT JOIN games g ON gp.game_id = g.id AND g.status = 'completed'
        WHERE p.id = $1
        GROUP BY p.id, p.name
      `, [playerId]);
      
      // Player's favorite hands
      let favoriteHands = { rows: [] };
      try {
        favoriteHands = await pool.query(`
          SELECT 
            COALESCE(hn.hand_type, hn.custom_name, '未知牌型') as hand_type,
            COUNT(*) as count
          FROM hand_notes hn
          JOIN games g ON hn.game_id = g.id
          WHERE hn.player_id = $1
            AND g.status = 'completed'
          GROUP BY COALESCE(hn.hand_type, hn.custom_name, '未知牌型')
          ORDER BY count DESC
          LIMIT 5
        `, [playerId]);
      } catch (e) {
        console.log('Favorite hands query failed');
      }
      
      playerStats = {
        basic: basicStats.rows[0] || null,
        favoriteHands: favoriteHands.rows || [],
        monthlyTrend: [],
        headToHead: []
      };
    }
    
    // 6. Yearly summary (simplified)
    let yearlySummary = { rows: [] };
    try {
      yearlySummary = await pool.query(`
        SELECT 
          EXTRACT(YEAR FROM g.created_at) as year,
          COUNT(DISTINCT g.id) as total_games
        FROM games g
        WHERE g.status = 'completed'
        GROUP BY EXTRACT(YEAR FROM g.created_at)
        ORDER BY year DESC
        LIMIT 5
      `);
    } catch (e) {
      console.log('Yearly summary query failed');
    }
    
    return NextResponse.json({
      global: globalStats.rows[0] || {
        total_games: 0,
        total_rounds: 0,
        total_money_exchanged: 0,
        avg_score_per_player: 0,
        total_players: 0
      },
      topHandTypes: topHandTypes.rows || [],
      playerRankings: playerRankings.rows || [],
      monthlyTrend: monthlyTrend.rows || [],
      playerStats,
      yearlySummary: yearlySummary.rows || [],
      currentYear: year
    });
    
  } catch (error) {
    console.error('Comprehensive stats error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      global: {
        total_games: 0,
        total_rounds: 0,
        total_money_exchanged: 0,
        avg_score_per_player: 0,
        total_players: 0
      },
      topHandTypes: [],
      playerRankings: [],
      monthlyTrend: [],
      yearlySummary: [],
      currentYear: new Date().getFullYear().toString()
    }, { status: 500 });
  }
}
