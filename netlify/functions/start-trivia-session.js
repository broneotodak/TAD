// Start a trivia session (admin only)
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

    // Check if session has questions
    const [questionCount] = await sql`
      SELECT COUNT(*) as count
      FROM trivia_questions
      WHERE session_id = ${sessionId}
    `;

    if (parseInt(questionCount.count) === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot start session without questions'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Deactivate any other active sessions for the same event
    const [session] = await sql`
      SELECT event_id FROM trivia_sessions WHERE id = ${sessionId}
    `;

    if (session) {
      await sql`
        UPDATE trivia_sessions
        SET is_active = false, ended_at = CURRENT_TIMESTAMP
        WHERE event_id = ${session.event_id} AND is_active = true AND id != ${sessionId}
      `;
    }

    // Clear all previous answers for questions in this session (reset leaderboard)
    const deleteResult = await sql`
      DELETE FROM trivia_answers
      WHERE EXISTS (
        SELECT 1 FROM trivia_questions tq 
        WHERE tq.id = trivia_answers.question_id 
        AND tq.session_id = ${sessionId}
      )
    `;
    console.log(`Cleared trivia answers for session ${sessionId}`);

    // Activate this session and reset question index
    const [updated] = await sql`
      UPDATE trivia_sessions
      SET 
        is_active = true, 
        started_at = CURRENT_TIMESTAMP, 
        ended_at = NULL,
        current_question_index = NULL,
        question_started_at = NULL
      WHERE id = ${sessionId}
      RETURNING *
    `;

    if (!updated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Session not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      session: {
        id: updated.id,
        eventId: updated.event_id,
        title: updated.title,
        isActive: updated.is_active,
        startedAt: updated.started_at
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error starting trivia session:', error);
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
  path: "/api/start-trivia-session"
};
