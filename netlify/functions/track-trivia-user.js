// Track user presence on trivia page (heartbeat)
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const { eventId: eventIdParam, sessionId: clientSessionId } = body;
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    if (!eventIdParam) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Event ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Convert eventId to integer to ensure proper matching
    const eventId = parseInt(eventIdParam, 10);
    if (isNaN(eventId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid Event ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Use client-provided session ID if available, otherwise generate one
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ip = context.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const timestamp = Math.floor(Date.now() / 60000); // Round to minutes for stability
    const sessionId = clientSessionId || `${eventId}-${ip}-${timestamp}`.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 64);
    
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
    
    console.log(`Tracked user presence: eventId=${eventId}, sessionId=${sessionId.substring(0, 20)}...`);
    
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
