// Reset lucky draw winners for an event
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
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Delete all winners for this event using a subquery join
    // This matches the same pattern used in get-lucky-draw-winners
    await sql`
      DELETE FROM lucky_draw_winners ldw
      USING participants p
      WHERE ldw.participant_id = p.id
        AND p.event_id = ${eventId}
    `;

    return new Response(JSON.stringify({
      success: true,
      message: 'All winners have been reset'
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error resetting lucky draw winners:', error);
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
  path: "/api/reset-lucky-draw-winners"
};
