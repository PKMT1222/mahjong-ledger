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

// Helper function to ensure columns exist with better error handling
async function ensureColumns() {
  try {
    console.log('Checking database columns...');
    
    // Check if columns exist
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rounds' AND column_name = 'is_draw'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('Adding is_draw column...');
      await pool.query(`ALTER TABLE rounds ADD COLUMN is_draw BOOLEAN DEFAULT FALSE`);
      console.log('✓ Added is_draw column');
    }
    
    const checkResult2 = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rounds' AND column_name = 'pass_dealer'
    `);
    
    if (checkResult2.rows.length === 0) {
      console.log('Adding pass_dealer column...');
      await pool.query(`ALTER TABLE rounds ADD COLUMN pass_dealer BOOLEAN DEFAULT FALSE`);
      console.log('✓ Added pass_dealer column');
    }
    
    return true;
  } catch (e: any) {
    console.error('ensureColumns error:', e.message);
    return false;
  }
}

// POST /api/games/[id]/rounds - Add a new round
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Ensure columns exist first (with retry)
    let migrationSuccess = false;
    for (let i = 0; i < 3; i++) {
      migrationSuccess = await ensureColumns();
      if (migrationSuccess) break;
      await new Promise(r => setTimeout(r, 100));
    }
    
    if (!migrationSuccess) {
      console.warn('Migration may have failed, proceeding anyway...');
    }
    
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
      is_draw,
      pass_dealer,
      hand_types,
      base_tai,
      total_points,
      notes
    } = body;
    
    // Validation
    if (!dealer_id) {
      return NextResponse.json({ error: 'Missing dealer_id' }, { status: 400 });
    }
    // Allow empty winner_ids for draw rounds
    if (!is_draw && (!winner_ids || !Array.isArray(winner_ids) || winner_ids.length === 0)) {
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
    
    if (is_draw) {
      // Draw round: no score change, all players get 0
      const allPlayers = await pool.query(
        'SELECT player_id FROM game_players WHERE game_id = $1',
        [gameId]
      );
      for (const p of allPlayers.rows) {
        scores[p.player_id] = 0;
      }
    } else if (is_self_draw) {
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
    
    // Check if new columns exist
    const columnsExist = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rounds' AND column_name IN ('is_draw', 'pass_dealer')
    `);
    const hasNewColumns = columnsExist.rows.length >= 2;
    
    // Insert round - use appropriate query based on column existence
    let roundResult;
    if (hasNewColumns) {
      roundResult = await pool.query(
        `INSERT INTO rounds (
          game_id, round_number, round_wind, hand_number, dealer_id, dealer_position,
          winner_ids, loser_id, is_self_draw, is_draw, pass_dealer, hand_type, base_tai, total_points,
          player_scores, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [
          gameId,
          roundNumber,
          currentWind,
          handInRound + 1,
          dealer_id,
          dealerPosition,
          winner_ids || [],
          loser_id || null,
          is_self_draw || false,
          is_draw || false,
          pass_dealer || false,
          is_draw ? '流局' : hand_types?.map((h: any) => h.name).join(', ') || '',
          base_tai || 0,
          is_draw ? 0 : points,
          JSON.stringify(scores),
          notes || ''
        ]
      );
    } else {
      // Fallback for old schema without new columns
      roundResult = await pool.query(
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
          winner_ids || [],
          loser_id || null,
          is_self_draw || false,
          is_draw ? '流局' : hand_types?.map((h: any) => h.name).join(', ') || '',
          base_tai || 0,
          is_draw ? 0 : points,
          JSON.stringify(scores),
          notes || ''
        ]
      );
    }
    
    const roundId = roundResult.rows[0].id;
    
    // Update player scores
    for (const [pid, scoreChange] of Object.entries(scores)) {
      await pool.query(
        'UPDATE game_players SET final_score = final_score + $1 WHERE game_id = $2 AND player_id = $3',
        [scoreChange, gameId, parseInt(pid)]
      );
    }
    
    // Update player stats (skip for draw rounds)
    if (!is_draw) {
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

// DELETE /api/games/[id]/rounds?id=xxx - Delete a specific round
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get('id');
    
    if (!roundId) {
      return NextResponse.json({ error: 'Missing round ID' }, { status: 400 });
    }
    
    const gameId = parseInt(id);
    
    // Start transaction
    await pool.query('BEGIN');
    
    try {
      // Get the round to delete
      const roundResult = await pool.query(
        'SELECT * FROM rounds WHERE id = $1 AND game_id = $2',
        [roundId, gameId]
      );
      
      if (roundResult.rows.length === 0) {
        await pool.query('ROLLBACK');
        return NextResponse.json({ error: 'Round not found' }, { status: 404 });
      }
      
      const round = roundResult.rows[0];
      
      // Reverse player scores
      const scores = round.player_scores || {};
      for (const [pid, scoreChange] of Object.entries(scores)) {
        await pool.query(
          'UPDATE game_players SET final_score = final_score - $1 WHERE game_id = $2 AND player_id = $3',
          [scoreChange, gameId, parseInt(pid)]
        );
      }
      
      // Reverse player stats (skip for draw rounds)
      if (!round.is_draw) {
        const winnerIds = round.winner_ids || [];
        for (const wid of winnerIds) {
          await pool.query(
            'UPDATE game_players SET wins = GREATEST(0, wins - 1) WHERE game_id = $1 AND player_id = $2',
            [gameId, wid]
          );
          if (round.is_self_draw) {
            await pool.query(
              'UPDATE game_players SET self_draws = GREATEST(0, self_draws - 1) WHERE game_id = $1 AND player_id = $2',
              [gameId, wid]
            );
          }
        }
        
        if (round.loser_id && !round.is_self_draw) {
          await pool.query(
            'UPDATE game_players SET deal_ins = GREATEST(0, deal_ins - 1) WHERE game_id = $1 AND player_id = $2',
            [gameId, round.loser_id]
          );
        }
      }
      
      // Delete the round
      await pool.query('DELETE FROM rounds WHERE id = $1', [roundId]);
      
      // Renumber remaining rounds
      await pool.query(`
        WITH numbered AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as new_num
          FROM rounds WHERE game_id = $1
        )
        UPDATE rounds r
        SET round_number = n.new_num
        FROM numbered n
        WHERE r.id = n.id
      `, [gameId]);
      
      // Update game round counter
      const countResult = await pool.query(
        'SELECT COUNT(*) as count FROM rounds WHERE game_id = $1',
        [gameId]
      );
      const roundCount = parseInt(countResult.rows[0].count);
      await pool.query(
        'UPDATE games SET current_round = $1 WHERE id = $2',
        [roundCount + 1, gameId]
      );
      
      await pool.query('COMMIT');
      
      return NextResponse.json({ success: true });
      
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Error deleting round:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
