import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    const result = await pool.query('SELECT NOW() as time');
    
    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tables = tablesResult.rows.map(r => r.table_name);
    
    return NextResponse.json({
      status: 'connected',
      time: result.rows[0].time,
      tables: tables,
      tables_count: tables.length
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    return NextResponse.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
