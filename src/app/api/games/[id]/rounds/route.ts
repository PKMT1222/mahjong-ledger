import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { GameVariant, HAND_TYPES, WINDS } from '@/types';

// Score calculation functions for each variant
function calculateTaiwanScore(
  baseScore: number,
  taiScore: number,
  baseTai: number,
  dealerRepeat: number,
  isSelfDraw: boolean,
  isDealer: boolean,
  doorDiceDouble: boolean
): number {
  let tai = baseTai;
  
  // Add dealer bonus
  if (isDealer || isSelfDraw) {
    tai += 1; // 莊家台
  }
  
  // 連莊拉莊 bonus
  tai += dealerRepeat;
  
  // 門骰加倍
  if (doorDiceDouble && isSelfDraw) {
    // Already counted in tai
  }
  
  const score = baseScore + (tai * taiScore);
  return isSelfDraw ? score * 3 : score; // Self draw = all pay, but we calculate total
}

function calculateJapaneseScore(
  han: number,
  fu: number,
  isDealer: boolean,
  isSelfDraw: boolean
): { points: number; payments: number[] } {
  // Basic score calculation
  let base = fu * Math.pow(2, han + 2);
  
  // Cap at 2000 for 5 han, 3000 for 6-7 han, etc.
  const limits: { [key: number]: number } = {
    3: 4000,   // Mangan
    4: 6000,   // Haneman
    5: 8000,   // Baiman
    6: 12000,  // Sanbaiman
    7: 16000,  // Kazoe-yakuman
  };
  
  if (han >= 3) {
    base = Math.min(base, limits[Math.min(han, 7)] || 16000);
  }
  
  // Round up to nearest 100
  base = Math.ceil(base / 100) * 100;
  
  if (isDealer) {
    if (isSelfDraw) {
      // Dealer self-draw: each player pays 1/3 (rounded up)
      const payment = Math.ceil(base / 300) * 100;
      return { points: base, payments: [payment, payment, payment] };
    } else {
      // Dealer win by discard: discarder pays full
      return { points: base * 6, payments: [base * 6] };
    }
  } else {
    if (isSelfDraw) {
      // Non-dealer self-draw: dealer pays half, others pay quarter
      const dealerPayment = Math.ceil(base / 200) * 100;
      const otherPayment = Math.ceil(base / 400) * 100;
      return { points: base, payments: [dealerPayment, otherPayment, otherPayment] };
    } else {
      // Non-dealer win by discard: discarder pays
      return { points: base * 4, payments: [base * 4] };
    }
  }
}

function calculateHongKongScore(
  tai: number,
  isSelfDraw: boolean,
  fullLiability: boolean,
  selfDrawMultiplier: number
): number {
  if (tai === 0) {
    // 雞胡 (chicken hand) - base payment
    return isSelfDraw ? 2 : 1;
  }
  
  let score = tai;
  
  if (isSelfDraw) {
    score *= selfDrawMultiplier;
  }
  
  return score;
}

// Main scoring function
async function calculateRoundScores(
  gameId: number,
  roundData: any
): Promise<{ scores: { [playerId: number]: number }; totalPoints: number }> {
  const gameResult = await pool.query('SELECT variant, settings FROM games WHERE id = $1', [gameId]);
  const game = gameResult.rows[0];
  const variant = game.variant as GameVariant;
  const settings = JSON.parse(game.settings);
  
  const { 
    winner_ids, 
    loser_id, 
    is_self_draw, 
    base_tai, 
    hand_types,
    is_dealer
  } = roundData;
  
  let scores: { [playerId: number]: number } = {};
  let totalPoints = 0;
  
  switch (variant) {
    case 'taiwan':
      totalPoints = calculateTaiwanScore(
        settings.baseScore || 100,
        settings.taiScore || 100,
        base_tai,
        settings.dealerRepeat || 0,
        is_self_draw,
        is_dealer,
        settings.doorDiceDouble || false
      );
      
      // Distribute points
      if (is_self_draw) {
        // All players pay
        const allPlayers = await pool.query(
          'SELECT player_id FROM game_players WHERE game_id = $1',
          [gameId]
        );
        for (const p of allPlayers.rows) {
          if (winner_ids.includes(p.player_id)) {
            scores[p.player_id] = totalPoints * (allPlayers.rows.length - 1);
          } else {
            scores[p.player_id] = -totalPoints;
          }
        }
      } else {
        // Only loser pays
        for (const winnerId of winner_ids) {
          scores[winnerId] = (scores[winnerId] || 0) + totalPoints;
        }
        if (loser_id) {
          scores[loser_id] = -totalPoints * winner_ids.length;
        }
      }
      break;
      
    case 'japanese':
      // Sum up han from hand_types
      const totalHan = hand_types?.reduce((sum: number, h: any) => sum + (h.tai || 0), 0) || base_tai;
      const fu = 30; // Base fu, could be calculated from hand composition
      
      const jpResult = calculateJapaneseScore(
        totalHan,
        fu,
        is_dealer,
        is_self_draw
      );
      
      totalPoints = jpResult.points;
      
      // Japanese scoring is more complex with 4 players
      // For now, simplified distribution
      if (winner_ids.length > 0) {
        scores[winner_ids[0]] = totalPoints;
        if (loser_id && !is_self_draw) {
          scores[loser_id] = -totalPoints;
        }
      }
      break;
      
    case 'hongkong':
      totalPoints = calculateHongKongScore(
        base_tai,
        is_self_draw,
        settings.fullLiability !== false,
        settings.selfDrawMultiplier || 2
      );
      
      if (is_self_draw) {
        const allPlayers = await pool.query(
          'SELECT player_id FROM game_players WHERE game_id = $1',
          [gameId]
        );
        for (const p of allPlayers.rows) {
          if (winner_ids.includes(p.player_id)) {
            scores[p.player_id] = totalPoints * (allPlayers.rows.length - 1);
          } else {
            scores[p.player_id] = -totalPoints;
          }
        }
      } else {
        for (const winnerId of winner_ids) {
          scores[winnerId] = (scores[winnerId] || 0) + totalPoints;
        }
        if (loser_id) {
          scores[loser_id] = -totalPoints * winner_ids.length;
        }
      }
      break;
      
    default:
      // Default simple scoring
      totalPoints = base_tai * 100;
      if (winner_ids.length > 0) {
        scores[winner_ids[0]] = totalPoints;
        if (loser_id) {
          scores[loser_id] = -totalPoints;
        }
      }
  }
  
  return { scores, totalPoints };
}

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
    const body = await request.json();
    
    const {
      dealer_id,
      winner_ids,
      loser_id,
      is_self_draw,
      hand_types, // Array of { name, tai }
      base_tai,
      is_bao_zimo,
      is_liichi,
      is_kong,
      is_surrender,
      is_false_win,
      is_exhaustive_draw,
      notes
    } = body;
    
    // Get game info
    const gameResult = await pool.query(
      'SELECT current_round, current_wind, dealer_repeat, settings FROM games WHERE id = $1',
      [id]
    );
    const game = gameResult.rows[0];
    const settings = JSON.parse(game.settings);
    
    // Get next round number
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM rounds WHERE game_id = $1',
      [id]
    );
    const roundNumber = parseInt(countResult.rows[0].count) + 1;
    
    // Determine wind and hand number
    const handInRound = (roundNumber - 1) % 4;
    const windIndex = Math.floor((roundNumber - 1) / 4) % 4;
    const currentWind = WINDS[windIndex];
    
    // Get dealer info
    const dealerResult = await pool.query(
      'SELECT seat_position, is_dealer FROM game_players WHERE game_id = $1 AND player_id = $2',
      [id, dealer_id]
    );
    const dealerPosition = dealerResult.rows[0]?.seat_position || 1;
    const isDealer = dealerResult.rows[0]?.is_dealer || false;
    
    // Calculate scores
    const { scores, totalPoints } = await calculateRoundScores(parseInt(id), {
      winner_ids,
      loser_id,
      is_self_draw,
      base_tai: base_tai || hand_types?.reduce((sum: number, h: any) => sum + (h.tai || 0), 0) || 0,
      hand_types,
      is_dealer: isDealer
    });
    
    // Create round
    const roundResult = await pool.query(
      `INSERT INTO rounds (
        game_id, round_number, round_wind, hand_number, dealer_id, dealer_position,
        winner_ids, loser_id, is_self_draw, hand_type, base_tai, dealer_repeat, total_points,
        is_bao_zimo, is_liichi, is_kong, is_surrender, is_false_win, is_exhaustive_draw,
        player_scores, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        id, roundNumber, currentWind, handInRound + 1, dealer_id, dealerPosition,
        winner_ids || [], loser_id || null, is_self_draw || false, 
        hand_types?.map((h: any) => h.name).join(', ') || '',
        base_tai || 0, game.dealer_repeat || 0, totalPoints,
        is_bao_zimo || false, is_liichi || false, is_kong || false,
        is_surrender || false, is_false_win || false, is_exhaustive_draw || false,
        JSON.stringify(scores), notes || ''
      ]
    );
    
    const roundId = roundResult.rows[0].id;
    
    // Save hand details
    if (hand_types && hand_types.length > 0) {
      for (let i = 0; i < hand_types.length; i++) {
        await pool.query(
          'INSERT INTO round_hands (round_id, hand_index, hand_type, tai, points) VALUES ($1, $2, $3, $4, $5)',
          [roundId, i, hand_types[i].name, hand_types[i].tai, hand_types[i].tai * 100]
        );
      }
    }
    
    // Update player scores
    for (const [playerId, scoreChange] of Object.entries(scores)) {
      await pool.query(
        'UPDATE game_players SET final_score = final_score + $1 WHERE game_id = $2 AND player_id = $3',
        [scoreChange, id, parseInt(playerId)]
      );
    }
    
    // Update game round counter
    let newDealerRepeat = game.dealer_repeat || 0;
    let newWind = game.current_wind;
    
    if (winner_ids && winner_ids.includes(dealer_id)) {
      // Dealer won, repeat
      newDealerRepeat += 1;
    } else {
      // Dealer didn't win, rotate
      newDealerRepeat = 0;
      // Rotate dealer to next player
      const nextDealerPosition = (dealerPosition % 4) + 1;
      await pool.query(
        'UPDATE game_players SET is_dealer = FALSE WHERE game_id = $1',
        [id]
      );
      await pool.query(
        'UPDATE game_players SET is_dealer = TRUE WHERE game_id = $1 AND seat_position = $2',
        [id, nextDealerPosition]
      );
      
      // Check if we need to change wind
      if (handInRound === 3) {
        const nextWindIndex = (windIndex + 1) % 4;
        newWind = WINDS[nextWindIndex];
      }
    }
    
    // Update game
    await pool.query(
      'UPDATE games SET current_round = $1, current_wind = $2, dealer_repeat = $3 WHERE id = $4',
      [roundNumber + 1, newWind, newDealerRepeat, id]
    );
    
    // Update player stats
    for (const winnerId of winner_ids || []) {
      await pool.query(
        'UPDATE game_players SET wins = wins + 1 WHERE game_id = $1 AND player_id = $2',
        [id, winnerId]
      );
      if (is_self_draw) {
        await pool.query(
          'UPDATE game_players SET self_draws = self_draws + 1 WHERE game_id = $1 AND player_id = $2',
          [id, winnerId]
        );
      }
    }
    
    if (loser_id && !is_self_draw) {
      await pool.query(
        'UPDATE game_players SET deal_ins = deal_ins + 1 WHERE game_id = $1 AND player_id = $2',
        [id, loser_id]
      );
    }
    
    // Add to history for undo
    await pool.query(
      'INSERT INTO game_history (game_id, action_type, action_data) VALUES ($1, $2, $3)',
      [id, 'ADD_ROUND', JSON.stringify({ roundId, scores })]
    );
    
    return NextResponse.json({
      round: roundResult.rows[0],
      scores,
      newWind,
      newDealerRepeat
    });
  } catch (error) {
    console.error('Error adding round:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
