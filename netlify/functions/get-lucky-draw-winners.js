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
        ldw.won_at as "wonAt",
        p.id as "participantId",
        p.name,
        p.company,
        p.table_number as "table",
        p.checked_in as "checkedIn",
        p.vip
      FROM lucky_draw_winners ldw
      JOIN participants p ON p.id = ldw.participant_id
      WHERE ldw.event_id = ${eventId}
      ORDER BY ldw.won_at DESC
    `;

    return new Response(JSON.stringify({
      success: true,
      winners: winners.map(w => ({
        id: w.id,
        participantId: w.participantId,
        name: w.name,
        company: w.company,
        table: w.table,
        checkedIn: w.checkedIn,
        vip: w.vip,
        wonAt: w.wonAt
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
