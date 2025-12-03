// Add a question to a trivia session
// Feature: Trivia (admin only)
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const {
      sessionId,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      questionOrder,
      timeLimitSeconds = 30,
      points = 10
    } = await req.json();

    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    if (!sessionId || !questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
      return new Response(JSON.stringify({
        success: false,
        error: 'All fields are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!['A', 'B', 'C', 'D'].includes(correctAnswer.toUpperCase())) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Correct answer must be A, B, C, or D'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get next order if not provided
    let order = questionOrder;
    if (!order) {
      const [maxOrder] = await sql`
        SELECT COALESCE(MAX(question_order), 0) + 1 as next_order
        FROM trivia_questions
        WHERE session_id = ${sessionId}
      `;
      order = parseInt(maxOrder.next_order);
    }

    const [question] = await sql`
      INSERT INTO trivia_questions (
        session_id,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        question_order,
        time_limit_seconds,
        points
      )
      VALUES (
        ${sessionId},
        ${questionText},
        ${optionA},
        ${optionB},
        ${optionC},
        ${optionD},
        ${correctAnswer.toUpperCase()},
        ${order},
        ${timeLimitSeconds},
        ${points}
      )
      RETURNING *
    `;

    return new Response(JSON.stringify({
      success: true,
      question: {
        id: question.id,
        sessionId: question.session_id,
        questionText: question.question_text,
        optionA: question.option_a,
        optionB: question.option_b,
        optionC: question.option_c,
        optionD: question.option_d,
        correctAnswer: question.correct_answer,
        questionOrder: question.question_order,
        timeLimitSeconds: question.time_limit_seconds,
        points: question.points
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error adding trivia question:', error);
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
  path: "/api/add-trivia-question"
};
