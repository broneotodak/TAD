// Update an existing trivia question
// Feature: Trivia
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { questionId, questionText, optionA, optionB, optionC, optionD, correctAnswer, timeLimitSeconds, points } = await req.json();
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

    // Verify question exists
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

    // Check if session is active - prevent editing during active session
    const [session] = await sql`
      SELECT is_active FROM trivia_sessions WHERE id = ${existingQuestion.session_id}
    `;

    if (session && session.is_active) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot edit questions while session is active. Please end the session first.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update question
    const [updated] = await sql`
      UPDATE trivia_questions
      SET 
        question_text = ${questionText},
        option_a = ${optionA},
        option_b = ${optionB},
        option_c = ${optionC},
        option_d = ${optionD},
        correct_answer = ${correctAnswer},
        time_limit_seconds = ${timeLimitSeconds},
        points = ${points}
      WHERE id = ${questionId}
      RETURNING *
    `;

    return new Response(JSON.stringify({
      success: true,
      question: {
        id: updated.id,
        questionText: updated.question_text,
        optionA: updated.option_a,
        optionB: updated.option_b,
        optionC: updated.option_c,
        optionD: updated.option_d,
        correctAnswer: updated.correct_answer,
        timeLimitSeconds: updated.time_limit_seconds,
        points: updated.points
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating question:', error);
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
  path: "/api/update-trivia-question"
};
