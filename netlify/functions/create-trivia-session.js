// Create a new trivia session
// Feature: Trivia (can be disabled via event features)
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { eventId, title } = await req.json();
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    if (!eventId || !title) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Event ID and title are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if trivia feature is enabled for this event
    const [event] = await sql`
      SELECT features FROM events WHERE id = ${eventId}
    `;

    if (!event) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Event not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const features = event.features || {};
    if (features.trivia !== true) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Trivia feature is not enabled for this event'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create trivia session
    const [session] = await sql`
      INSERT INTO trivia_sessions (event_id, title, is_active)
      VALUES (${eventId}, ${title}, false)
      RETURNING *
    `;

    return new Response(JSON.stringify({
      success: true,
      session: {
        id: session.id,
        eventId: session.event_id,
        title: session.title,
        isActive: session.is_active,
        createdAt: session.created_at
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating trivia session:', error);
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
  path: "/api/create-trivia-session"
};
