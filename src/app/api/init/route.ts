import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST() {
  try {
    console.log('Starting database initialization...');
    
    // Players table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ players table created');

    // Games table (simple, no user_id)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        variant VARCHAR(20) NOT NULL DEFAULT 'hongkong',
        status VARCHAR(20) DEFAULT 'active',
        settings JSONB DEFAULT '{}',
        current_round INTEGER DEFAULT 1,
        current_wind VARCHAR(10) DEFAULT '東',
        dealer_repeat INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);
    console.log('✓ games table created');

    // Game players with stats
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_players (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
        player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
        seat_position INTEGER NOT NULL,
        final_score INTEGER DEFAULT 0,
        is_dealer BOOLEAN DEFAULT FALSE,
        wins INTEGER DEFAULT 0,
        self_draws INTEGER DEFAULT 0,
        deal_ins INTEGER DEFAULT 0,
        riichi_count INTEGER DEFAULT 0,
        UNIQUE(game_id, player_id)
      )
    `);
    console.log('✓ game_players table created');

    // Rounds with full scoring details
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rounds (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
        round_number INTEGER NOT NULL,
        round_wind VARCHAR(10) NOT NULL,
        hand_number INTEGER NOT NULL,
        dealer_id INTEGER REFERENCES players(id),
        dealer_position INTEGER,
        winner_ids INTEGER[] DEFAULT '{}',
        loser_id INTEGER REFERENCES players(id),
        is_self_draw BOOLEAN DEFAULT FALSE,
        is_draw BOOLEAN DEFAULT FALSE,
        pass_dealer BOOLEAN DEFAULT FALSE,
        hand_type VARCHAR(100),
        base_tai INTEGER DEFAULT 0,
        dealer_repeat INTEGER DEFAULT 0,
        total_points INTEGER DEFAULT 0,
        is_bao_zimo BOOLEAN DEFAULT FALSE,
        is_liichi BOOLEAN DEFAULT FALSE,
        is_kong BOOLEAN DEFAULT FALSE,
        is_surrender BOOLEAN DEFAULT FALSE,
        is_false_win BOOLEAN DEFAULT FALSE,
        is_exhaustive_draw BOOLEAN DEFAULT FALSE,
        player_scores JSONB DEFAULT '{}',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ rounds table created');

    // Add new columns if they don't exist (for existing databases)
    try {
      await pool.query(`ALTER TABLE rounds ADD COLUMN IF NOT EXISTS is_draw BOOLEAN DEFAULT FALSE`);
      await pool.query(`ALTER TABLE rounds ADD COLUMN IF NOT EXISTS pass_dealer BOOLEAN DEFAULT FALSE`);
      await pool.query(`ALTER TABLE rounds ADD COLUMN IF NOT EXISTS is_bao_zimo BOOLEAN DEFAULT FALSE`);
      await pool.query(`ALTER TABLE rounds ADD COLUMN IF NOT EXISTS bao_payer_id INTEGER REFERENCES players(id)`);
      console.log('✓ Added new columns to rounds table');
    } catch (e) {
      console.log('Columns may already exist');
    }
    
    // Add custom_name column to hand_notes if not exists
    try {
      await pool.query(`ALTER TABLE hand_notes ADD COLUMN IF NOT EXISTS custom_name VARCHAR(100)`);
      console.log('✓ Added custom_name column to hand_notes table');
    } catch (e) {
      console.log('custom_name column may already exist');
    }

    // Hand details for multi-hand support
    await pool.query(`
      CREATE TABLE IF NOT EXISTS round_hands (
        id SERIAL PRIMARY KEY,
        round_id INTEGER REFERENCES rounds(id) ON DELETE CASCADE,
        hand_index INTEGER NOT NULL,
        hand_type VARCHAR(100) NOT NULL,
        tai INTEGER DEFAULT 0,
        points INTEGER DEFAULT 0
      )
    `);
    console.log('✓ round_hands table created');

    // Transactions for settlements
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        round_id INTEGER REFERENCES rounds(id) ON DELETE CASCADE,
        from_player_id INTEGER REFERENCES players(id),
        to_player_id INTEGER REFERENCES players(id),
        amount INTEGER NOT NULL,
        reason VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ transactions table created');

    // Game history / undo stack
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_history (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
        action_type VARCHAR(50) NOT NULL,
        action_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ game_history table created');

    // Player statistics across all games
    await pool.query(`
      CREATE TABLE IF NOT EXISTS player_stats (
        id SERIAL PRIMARY KEY,
        player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
        variant VARCHAR(20),
        games_played INTEGER DEFAULT 0,
        total_score BIGINT DEFAULT 0,
        wins INTEGER DEFAULT 0,
        self_draws INTEGER DEFAULT 0,
        deal_ins INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(player_id, variant)
      )
    `);
    console.log('✓ player_stats table created');

    // Hand notes for detailed recording
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hand_notes (
        id SERIAL PRIMARY KEY,
        round_id INTEGER REFERENCES rounds(id) ON DELETE CASCADE,
        game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
        player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
        hand_type VARCHAR(100),
        hand_tiles JSONB DEFAULT '[]',
        winning_tile VARCHAR(10),
        is_self_draw BOOLEAN DEFAULT FALSE,
        is_dealer BOOLEAN DEFAULT FALSE,
        fan_count INTEGER DEFAULT 0,
        score INTEGER DEFAULT 0,
        notes TEXT,
        mood VARCHAR(50),
        location VARCHAR(200),
        tags JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ hand_notes table created');

    return NextResponse.json({ 
      success: true,
      message: 'Database initialized successfully',
      tables: ['players', 'games', 'game_players', 'rounds', 'round_hands', 'transactions', 'game_history', 'player_stats', 'hand_notes']
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
