import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/migrate - Add missing columns to existing database
export async function GET() {
  try {
    console.log('Running database migration...');
    
    const results: string[] = [];
    
    // Check and add is_draw column
    try {
      await pool.query(`ALTER TABLE rounds ADD COLUMN IF NOT EXISTS is_draw BOOLEAN DEFAULT FALSE`);
      results.push('✓ Added is_draw column');
    } catch (e: any) {
      results.push(`✗ is_draw: ${e.message}`);
    }
    
    // Check and add pass_dealer column
    try {
      await pool.query(`ALTER TABLE rounds ADD COLUMN IF NOT EXISTS pass_dealer BOOLEAN DEFAULT FALSE`);
      results.push('✓ Added pass_dealer column');
    } catch (e: any) {
      results.push(`✗ pass_dealer: ${e.message}`);
    }
    
    // Check current columns
    const columns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rounds'
    `);
    
    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results,
      existingColumns: columns.rows.map((r: any) => r.column_name)
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
