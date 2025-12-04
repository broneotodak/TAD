// Advance to next question in trivia session (admin control)
// Feature: Trivia
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { sessionId, questionIndex } = await req.json();
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    if (!sessionId || questionIndex === undefined) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Session ID and question index are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify session exists and is active
    const [session] = await sql`
      SELECT * FROM trivia_sessions WHERE id = ${sessionId}
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

    if (!session.is_active) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Session is not active'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get total questions count
    const [questionCount] = await sql`
      SELECT COUNT(*) as count
      FROM trivia_questions
      WHERE session_id = ${sessionId}
    `;

    const totalQuestions = parseInt(questionCount.count);
    
    if (questionIndex < 0 || questionIndex >= totalQuestions) {
      return new Response(JSON.stringify({
        success: false,
        error: `Question index must be between 0 and ${totalQuestions - 1}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update session with current question index and start time
    const [updated] = await sql`
      UPDATE trivia_sessions
      SET 
        current_question_index = ${questionIndex},
        question_started_at = CURRENT_TIMESTAMP
      WHERE id = ${sessionId}
      RETURNING *
    `;

    // Get the question details
    const [question] = await sql`
      SELECT 
        id,
        question_text as "questionText",
        option_a as "optionA",
        option_b as "optionB",
        option_c as "optionC",
        option_d as "optionD",
        question_order as "questionOrder",
        time_limit_seconds as "timeLimitSeconds",
        points
      FROM trivia_questions
      WHERE session_id = ${sessionId}
      ORDER BY question_order ASC
      LIMIT 1 OFFSET ${questionIndex}
    `;

    return new Response(JSON.stringify({
      success: true,
      currentQuestionIndex: questionIndex,
      question: question ? {
        id: question.id,
        questionText: question.questionText,
        optionA: question.optionA,
        optionB: question.optionB,
        optionC: question.optionC,
        optionD: question.optionD,
        questionOrder: question.questionOrder,
        timeLimitSeconds: question.timeLimitSeconds,
        points: question.points
      } : null,
      startedAt: updated.question_started_at
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error advancing question:', error);
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
  path: "/api/advance-trivia-question"
};
