// Reset trivia leaderboard (clear all answers for a session)
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

    // Delete all answers for questions in this session
    const deleteResult = await sql`
      DELETE FROM trivia_answers
      WHERE EXISTS (
        SELECT 1 FROM trivia_questions tq 
        WHERE tq.id = trivia_answers.question_id 
        AND tq.session_id = ${sessionId}
      )
    `;

    console.log(`Cleared ${deleteResult.count || 0} trivia answers for session ${sessionId}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Leaderboard has been reset',
      deletedCount: deleteResult.count || 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error resetting trivia leaderboard:', error);
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
  path: "/api/reset-trivia-leaderboard"
};
