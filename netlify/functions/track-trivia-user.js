// Track user presence on trivia page (heartbeat)
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { eventId } = await req.json();
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    if (!eventId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Event ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate a unique session ID for this user (browser session)
    // Use a combination of user agent and timestamp
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const timestamp = Date.now();
    // Simple hash-like ID generation
    const sessionId = `${eventId}-${btoa(userAgent + timestamp).substring(0, 32)}`;
    
    // Create table if it doesn't exist
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS trivia_active_users (
          id SERIAL PRIMARY KEY,
          event_id INTEGER NOT NULL,
          session_id TEXT NOT NULL,
          last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(event_id, session_id)
        )
      `;
    } catch (e) {
      // Table might already exist, continue
    }

    // Upsert: update last_seen if exists, insert if not
    await sql`
      INSERT INTO trivia_active_users (event_id, session_id, last_seen)
      VALUES (${eventId}, ${sessionId}, CURRENT_TIMESTAMP)
      ON CONFLICT (event_id, session_id)
      DO UPDATE SET last_seen = CURRENT_TIMESTAMP
    `;
    
    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error tracking trivia user:', error);
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
  path: "/api/track-trivia-user"
};
