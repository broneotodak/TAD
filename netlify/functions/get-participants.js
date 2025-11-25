// Get all participants with table assignments
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    // Get eventId from query parameter (optional - defaults to active event)
    const url = new URL(req.url);
    let eventId = url.searchParams.get('eventId');

    // If no eventId provided, get the active event
    if (!eventId) {
      const [activeEvent] = await sql`
        SELECT id FROM events WHERE is_active = true ORDER BY created_at DESC LIMIT 1
      `;
      eventId = activeEvent?.id;
    }

    if (!eventId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No active event found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const participants = await sql`
      SELECT 
        id,
        name,
        company,
        vip,
        table_number as "table",
        checked_in as "checkedIn",
        checked_in_at as "checkedInAt"
      FROM participants
      WHERE event_id = ${eventId}
      ORDER BY id ASC
    `;

    const tables = await sql`
      SELECT 
        table_number as number,
        seats
      FROM tables_config
      WHERE event_id = ${eventId}
      ORDER BY table_number ASC
    `;

    return new Response(JSON.stringify({
      success: true,
      eventId: parseInt(eventId),
      participants: participants || [],
      tables: tables || [],
      lastUpdated: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Error fetching participants:', error);
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
  path: "/api/get-participants"
};

