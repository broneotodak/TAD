// Save a lucky draw winner to database
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { eventId, participantId } = await req.json();
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    if (!eventId || !participantId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Event ID and Participant ID are required'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Check if participant already won (if not allowing multiple wins)
    const [existing] = await sql`
      SELECT id FROM lucky_draw_winners
      WHERE event_id = ${eventId} AND participant_id = ${participantId}
    `;

    if (existing) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Participant has already won'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Insert winner
    const [winner] = await sql`
      INSERT INTO lucky_draw_winners (event_id, participant_id, won_at)
      VALUES (${eventId}, ${participantId}, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    return new Response(JSON.stringify({
      success: true,
      winner: {
        id: winner.id,
        eventId: winner.event_id,
        participantId: winner.participant_id,
        wonAt: winner.won_at
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error saving lucky draw winner:', error);
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
  path: "/api/save-lucky-draw-winner"
};
