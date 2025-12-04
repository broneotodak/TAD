// Save a lucky draw winner to database
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { participantId, eventId } = await req.json();
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    if (!participantId || !eventId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Participant ID and Event ID are required'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Check if winner already exists
    const [existing] = await sql`
      SELECT id FROM lucky_draw_winners 
      WHERE participant_id = ${participantId}
    `;

    if (existing) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This participant has already won'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Insert winner (event_id column may not exist in older schemas)
    let winner;
    try {
        [winner] = await sql`
          INSERT INTO lucky_draw_winners (participant_id, event_id)
          VALUES (${participantId}, ${eventId})
          RETURNING *
        `;
    } catch (error) {
        if (error.message.includes('event_id') || error.message.includes('column')) {
            [winner] = await sql`
              INSERT INTO lucky_draw_winners (participant_id)
              VALUES (${participantId})
              RETURNING *
            `;
        } else {
            throw error;
        }
    }

    return new Response(JSON.stringify({
      success: true,
      winner: {
        id: winner.id,
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
