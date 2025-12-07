// Get count of users currently waiting on trivia page
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  try {
    const url = new URL(req.url);
    const eventIdParam = url.searchParams.get('eventId');
    
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

    // Get users who sent heartbeat in last 30 seconds with their participant names
    // If table doesn't exist, create it first
    try {
      // Try to create table if it doesn't exist (ignore error if exists)
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

    // Get active users with participant names (last seen within last 30 seconds)
    const activeUsers = await sql`
      SELECT 
        tau.id,
        tau.session_id,
        tau.participant_id,
        p.name,
        p.company,
        tau.last_seen
      FROM trivia_active_users tau
      LEFT JOIN participants p ON p.id = tau.participant_id
      WHERE tau.event_id = ${eventId}
        AND tau.last_seen > CURRENT_TIMESTAMP - INTERVAL '30 seconds'
      ORDER BY tau.last_seen DESC
    `;

    const participants = activeUsers.map(user => ({
      sessionId: user.session_id,
      participantId: user.participant_id,
      name: user.name || 'Anonymous',
      company: user.company || null,
      lastSeen: user.last_seen
    }));

    const count = participants.length;
    
    console.log(`Waiting users for eventId=${eventId}: ${count} participants`);
    
    return new Response(JSON.stringify({
      success: true,
      count: count,
      participants: participants
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error getting waiting users count:', error);
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
  path: "/api/get-trivia-waiting-users"
};
