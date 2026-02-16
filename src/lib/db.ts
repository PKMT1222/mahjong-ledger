import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Auto-migrate: Add missing columns on startup
async function autoMigrate() {
  try {
    console.log('Checking database schema...');
    
    // Check if is_draw column exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rounds' AND column_name = 'is_draw'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('Adding missing columns to rounds table...');
      
      // Add is_draw column
      await pool.query(`ALTER TABLE rounds ADD COLUMN IF NOT EXISTS is_draw BOOLEAN DEFAULT FALSE`);
      console.log('✓ Added is_draw column');
      
      // Add pass_dealer column
      await pool.query(`ALTER TABLE rounds ADD COLUMN IF NOT EXISTS pass_dealer BOOLEAN DEFAULT FALSE`);
      console.log('✓ Added pass_dealer column');
      
      console.log('Database migration completed!');
    } else {
      console.log('Database schema is up to date');
    }
  } catch (error) {
    console.error('Auto-migration error:', error);
    // Don't throw - app should still work even if migration fails
  }
}

// Run migration on startup
autoMigrate();

export default pool;
