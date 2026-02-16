import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST() {
  try {
    // Users table for authentication
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);

    // Players table (now linked to users optionally)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(100) NOT NULL,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Games table with user ownership
    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        variant VARCHAR(20) NOT NULL DEFAULT 'hongkong',
        status VARCHAR(20) DEFAULT 'active',
        settings JSONB DEFAULT '{}',
        current_round INTEGER DEFAULT 1,
        current_wind VARCHAR(10) DEFAULT '東',
        dealer_repeat INTEGER DEFAULT 0,
        is_public BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

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

    return NextResponse.json({ 
      success: true,
      message: 'Database initialized successfully with auth support'
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
