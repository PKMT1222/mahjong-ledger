import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/players - List all players with stats
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        COALESCE(ps.games_played, 0) as games_played,
        COALESCE(ps.total_score, 0) as total_score,
        COALESCE(ps.wins, 0) as wins,
        COALESCE(ps.self_draws, 0) as self_draws,
        COALESCE(ps.deal_ins, 0) as deal_ins
      FROM players p
      LEFT JOIN player_stats ps ON p.id = ps.player_id
      ORDER BY p.name
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// POST /api/players - Create new player
export async function POST(request: Request) {
  try {
    const { name, avatar_url } = await request.json();
    
    const result = await pool.query(
      'INSERT INTO players (name, avatar_url) VALUES ($1, $2) RETURNING *',
      [name, avatar_url || null]
    );
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// PUT /api/players/[id] - Update player
export async function PUT(request: Request) {
  try {
    const { id, name, avatar_url } = await request.json();
    
    const result = await pool.query(
      'UPDATE players SET name = $1, avatar_url = $2 WHERE id = $3 RETURNING *',
      [name, avatar_url, id]
    );
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// DELETE /api/players - Delete player
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
    }
    
    // Check if player exists
    const checkResult = await pool.query('SELECT id FROM players WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    
    // Delete player (cascade will handle related records)
    await pool.query('DELETE FROM players WHERE id = $1', [id]);
    
    return NextResponse.json({ success: true, message: 'Player deleted' });
  } catch (error) {
    console.error('Delete player error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
