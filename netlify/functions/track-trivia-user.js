// Track user presence on trivia page (heartbeat)
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const { eventId: eventIdParam, sessionId: clientSessionId, participantId: participantIdParam } = body;
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

    // Convert participantId to integer if provided
    const participantId = participantIdParam ? parseInt(participantIdParam, 10) : null;

    // Use client-provided session ID if available, otherwise generate one
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ip = context.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const timestamp = Math.floor(Date.now() / 60000); // Round to minutes for stability
    const sessionId = clientSessionId || `${eventId}-${ip}-${timestamp}`.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 64);
    
    // Create table if it doesn't exist (with participant_id column)
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS trivia_active_users (
          id SERIAL PRIMARY KEY,
          event_id INTEGER NOT NULL,
          session_id TEXT NOT NULL,
          participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE,
          last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(event_id, session_id)
        )
      `;
      
      // Add participant_id column if it doesn't exist (for existing tables)
      try {
        await sql`
          ALTER TABLE trivia_active_users 
          ADD COLUMN IF NOT EXISTS participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE
        `;
      } catch (e) {
        // Column might already exist, continue
      }
    } catch (e) {
      // Table might already exist, try to add column
      try {
        await sql`
          ALTER TABLE trivia_active_users 
          ADD COLUMN IF NOT EXISTS participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE
        `;
      } catch (e2) {
        // Column might already exist, continue
      }
    }

    // Upsert: update last_seen and participant_id if exists, insert if not
    await sql`
      INSERT INTO trivia_active_users (event_id, session_id, participant_id, last_seen)
      VALUES (${eventId}, ${sessionId}, ${participantId}, CURRENT_TIMESTAMP)
      ON CONFLICT (event_id, session_id)
      DO UPDATE SET last_seen = CURRENT_TIMESTAMP, participant_id = COALESCE(EXCLUDED.participant_id, trivia_active_users.participant_id)
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
