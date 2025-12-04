// Delete a trivia session (admin only)
// Feature: Trivia
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { sessionId } = await req.json();
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    if (!sessionId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Session ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if session exists and get its status
    const [session] = await sql`
      SELECT id, is_active, title FROM trivia_sessions WHERE id = ${sessionId}
    `;

    if (!session) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Session not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Warn if trying to delete active session (but allow it)
    if (session.is_active) {
      // Still allow deletion, but log a warning
      console.warn(`Deleting active session: ${session.title} (ID: ${sessionId})`);
    }

    // Delete session (CASCADE will delete questions and answers automatically)
    await sql`
      DELETE FROM trivia_sessions WHERE id = ${sessionId}
    `;

    return new Response(JSON.stringify({
      success: true,
      message: 'Session deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting trivia session:', error);
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
  path: "/api/delete-trivia-session"
};
