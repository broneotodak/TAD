// Get lucky draw winners for an event (public view)
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  try {
    const url = new URL(req.url);
    const eventId = url.searchParams.get('eventId');
    
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    if (!eventId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Event ID is required'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Get winners with participant details
    const winners = await sql`
      SELECT 
        ldw.id,
        ldw.participant_id as "participantId",
        ldw.won_at as "wonAt",
        p.name,
        p.company,
        p.table_number as "table",
        p.checked_in as "checkedIn"
      FROM lucky_draw_winners ldw
      INNER JOIN participants p ON p.id = ldw.participant_id
      WHERE p.event_id = ${eventId}
      ORDER BY ldw.won_at DESC
    `;

    return new Response(JSON.stringify({
      success: true,
      winners: winners.map(w => ({
        id: w.participantId,
        name: w.name,
        company: w.company || '',
        table: w.table || null,
        wonAt: w.wonAt,
        checkedIn: w.checkedIn
      }))
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error getting lucky draw winners:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

export const config = {
  path: "/api/get-lucky-draw-winners"
};
