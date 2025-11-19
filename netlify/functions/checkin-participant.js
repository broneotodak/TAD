// Check in a participant
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { participantId } = await req.json();
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    const result = await sql`
      UPDATE participants 
      SET 
        checked_in = TRUE,
        checked_in_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${participantId}
      RETURNING id, name, table_number as "table", checked_in as "checkedIn"
    `;

    if (result.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Participant not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      participant: result[0]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error checking in participant:', error);
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
  path: "/api/checkin-participant"
};

