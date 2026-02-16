import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const WINDS = ['東', '南', '西', '北'];

// GET /api/games/[id]/rounds - Get all rounds for a game
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const result = await pool.query(`
      SELECT 
        r.*,
        d.name as dealer_name,
        l.name as loser_name
      FROM rounds r
      LEFT JOIN players d ON r.dealer_id = d.id
      LEFT JOIN players l ON r.loser_id = l.id
      WHERE r.game_id = $1
      ORDER BY r.round_number
    `, [id]);
    
    // Get winner names
    const rounds = result.rows;
    for (const round of rounds) {
      if (round.winner_ids && round.winner_ids.length > 0) {
        const winnersResult = await pool.query(
          'SELECT id, name FROM players WHERE id = ANY($1)',
          [round.winner_ids]
        );
        round.winners = winnersResult.rows;
      }
    }
    
    return NextResponse.json(rounds);
  } catch (error) {
    console.error('Error fetching rounds:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// POST /api/games/[id]/rounds - Add a new round
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    
    console.log('POST round - gameId:', id, 'body:', JSON.stringify(body, null, 2));
    
    const {
      dealer_id,
      winner_ids,
      loser_id,
      is_self_draw,
      hand_types,
      base_tai,
      total_points,
      notes
    } = body;
    
    // Validation
    if (!dealer_id) {
      return NextResponse.json({ error: 'Missing dealer_id' }, { status: 400 });
    }
    if (!winner_ids || !Array.isArray(winner_ids) || winner_ids.length === 0) {
      return NextResponse.json({ error: 'Missing winner_ids' }, { status: 400 });
    }
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
    }
    
    const gameId = parseInt(id);
    
    // Get current round count
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM rounds WHERE game_id = $1',
      [gameId]
    );
    const roundNumber = parseInt(countResult.rows[0].count) + 1;
    
    // Determine wind
    const handInRound = (roundNumber - 1) % 4;
    const windIndex = Math.floor((roundNumber - 1) / 4) % 4;
    const currentWind = WINDS[windIndex];
    
    // Get dealer position
    const dealerResult = await pool.query(
      'SELECT seat_position FROM game_players WHERE game_id = $1 AND player_id = $2',
      [gameId, dealer_id]
    );
    const dealerPosition = dealerResult.rows[0]?.seat_position || 1;
    
    // Calculate scores
    const scores: { [key: number]: number } = {};
    const points = total_points || (base_tai || 0);
    
    if (is_self_draw) {
      // Self draw: everyone else pays
      const allPlayers = await pool.query(
        'SELECT player_id FROM game_players WHERE game_id = $1',
        [gameId]
      );
      for (const p of allPlayers.rows) {
        if (winner_ids.includes(p.player_id)) {
          scores[p.player_id] = points * (allPlayers.rows.length - 1);
        } else {
          scores[p.player_id] = -points;
        }
      }
    } else {
      // Discard: loser pays
      for (const wid of winner_ids) {
        scores[wid] = (scores[wid] || 0) + points;
      }
      if (loser_id) {
        scores[loser_id] = -points * winner_ids.length;
      }
    }
    
    // Insert round
    const roundResult = await pool.query(
      `INSERT INTO rounds (
        game_id, round_number, round_wind, hand_number, dealer_id, dealer_position,
        winner_ids, loser_id, is_self_draw, hand_type, base_tai, total_points,
        player_scores, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        gameId,
        roundNumber,
        currentWind,
        handInRound + 1,
        dealer_id,
        dealerPosition,
        winner_ids,
        loser_id || null,
        is_self_draw || false,
        hand_types?.map((h: any) => h.name).join(', ') || '',
        base_tai || 0,
        points,
        JSON.stringify(scores),
        notes || ''
      ]
    );
    
    const roundId = roundResult.rows[0].id;
    
    // Update player scores
    for (const [pid, scoreChange] of Object.entries(scores)) {
      await pool.query(
        'UPDATE game_players SET final_score = final_score + $1 WHERE game_id = $2 AND player_id = $3',
        [scoreChange, gameId, parseInt(pid)]
      );
    }
    
    // Update player stats
    for (const wid of winner_ids) {
      await pool.query(
        'UPDATE game_players SET wins = wins + 1 WHERE game_id = $1 AND player_id = $2',
        [gameId, wid]
      );
      if (is_self_draw) {
        await pool.query(
          'UPDATE game_players SET self_draws = self_draws + 1 WHERE game_id = $1 AND player_id = $2',
          [gameId, wid]
        );
      }
    }
    
    if (loser_id && !is_self_draw) {
      await pool.query(
        'UPDATE game_players SET deal_ins = deal_ins + 1 WHERE game_id = $1 AND player_id = $2',
        [gameId, loser_id]
      );
    }
    
    // Update game round counter
    await pool.query(
      'UPDATE games SET current_round = current_round + 1 WHERE id = $1',
      [gameId]
    );
    
    return NextResponse.json({
      success: true,
      round: roundResult.rows[0],
      scores
    });
    
  } catch (error) {
    console.error('Error adding round:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
