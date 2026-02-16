import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/players - List all players
export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM players ORDER BY name');
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
    const { name } = await request.json();
    const result = await pool.query(
      'INSERT INTO players (name) VALUES ($1) RETURNING *',
      [name]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
