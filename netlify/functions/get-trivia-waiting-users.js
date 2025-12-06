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

    // Count users who sent heartbeat in last 30 seconds
    // Using a simple approach: count records in trivia_active_users table
    // If table doesn't exist, create it first
    try {
      // Try to create table if it doesn't exist (ignore error if exists)
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

    // Count active users (last seen within last 30 seconds)
    const activeUsers = await sql`
      SELECT COUNT(*) as count
      FROM trivia_active_users
      WHERE event_id = ${eventId}
        AND last_seen > CURRENT_TIMESTAMP - INTERVAL '30 seconds'
    `;

    const count = parseInt(activeUsers[0]?.count || 0);
    
    console.log(`Waiting users count for eventId=${eventId}: ${count}`);
    
    return new Response(JSON.stringify({
      success: true,
      count: count
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
