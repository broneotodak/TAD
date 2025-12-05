// Delete a trivia question
// Feature: Trivia
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { questionId } = await req.json();
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    if (!questionId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Question ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify question exists and get session ID
    const [existingQuestion] = await sql`
      SELECT id, session_id FROM trivia_questions WHERE id = ${questionId}
    `;

    if (!existingQuestion) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Question not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if session is active - prevent deleting during active session
    const [session] = await sql`
      SELECT is_active FROM trivia_sessions WHERE id = ${existingQuestion.session_id}
    `;

    if (session && session.is_active) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot delete questions while session is active. Please end the session first.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete all answers for this question first (cascade)
    await sql`
      DELETE FROM trivia_answers WHERE question_id = ${questionId}
    `;

    // Delete the question
    await sql`
      DELETE FROM trivia_questions WHERE id = ${questionId}
    `;

    // Reorder remaining questions to maintain sequential order
    const remainingQuestions = await sql`
      SELECT id FROM trivia_questions 
      WHERE session_id = ${existingQuestion.session_id}
      ORDER BY question_order ASC
    `;

    // Update question_order to be sequential (0, 1, 2, ...)
    for (let i = 0; i < remainingQuestions.length; i++) {
      await sql`
        UPDATE trivia_questions
        SET question_order = ${i}
        WHERE id = ${remainingQuestions[i].id}
      `;
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Question deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting question:', error);
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
  path: "/api/delete-trivia-question"
};
