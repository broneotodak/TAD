// Initialize database tables
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    // Create participants table
    await sql`
      CREATE TABLE IF NOT EXISTS participants (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        company TEXT,
        vip BOOLEAN DEFAULT FALSE,
        table_number INTEGER,
        checked_in BOOLEAN DEFAULT FALSE,
        checked_in_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create tables configuration
    await sql`
      CREATE TABLE IF NOT EXISTS tables_config (
        id SERIAL PRIMARY KEY,
        table_number INTEGER NOT NULL UNIQUE,
        seats INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create lucky draw winners table
    await sql`
      CREATE TABLE IF NOT EXISTS lucky_draw_winners (
        id SERIAL PRIMARY KEY,
        participant_id INTEGER REFERENCES participants(id),
        won_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create event settings table
    await sql`
      CREATE TABLE IF NOT EXISTS event_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Database initialized successfully' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Database initialization error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = {
  path: "/api/init-db"
};

