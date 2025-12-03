// Submit an answer to a trivia question
// Feature: Trivia (participants only)
// Uses database timestamp to determine first correct answer
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { questionId, participantId, answer } = await req.json();
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    if (!questionId || !participantId || !answer) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Question ID, Participant ID, and answer are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!['A', 'B', 'C', 'D'].includes(answer.toUpperCase())) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Answer must be A, B, C, or D'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if participant already answered this question
    const [existing] = await sql`
      SELECT id FROM trivia_answers
      WHERE question_id = ${questionId} AND participant_id = ${participantId}
    `;

    if (existing) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You have already answered this question'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get question details
    const [question] = await sql`
      SELECT correct_answer, points, session_id
      FROM trivia_questions
      WHERE id = ${questionId}
    `;

    if (!question) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Question not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const isCorrect = answer.toUpperCase() === question.correct_answer;
    
    // Calculate points based on whether it's the first correct answer
    let pointsEarned = 0;
    if (isCorrect) {
      // Check if there's already a correct answer
      const [firstCorrect] = await sql`
        SELECT id, answered_at
        FROM trivia_answers
        WHERE question_id = ${questionId} AND is_correct = true
        ORDER BY answered_at ASC
        LIMIT 1
      `;

      if (!firstCorrect) {
        // First correct answer - full points
        pointsEarned = question.points;
      } else {
        // Not first - half points
        pointsEarned = Math.floor(question.points / 2);
      }
    }

    // Insert answer
    const [result] = await sql`
      INSERT INTO trivia_answers (
        question_id,
        participant_id,
        answer,
        is_correct,
        points_earned
      )
      VALUES (
        ${questionId},
        ${participantId},
        ${answer.toUpperCase()},
        ${isCorrect},
        ${pointsEarned}
      )
      RETURNING *
    `;

    return new Response(JSON.stringify({
      success: true,
      answer: {
        id: result.id,
        isCorrect: result.is_correct,
        pointsEarned: result.points_earned,
        answeredAt: result.answered_at
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error submitting trivia answer:', error);
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
  path: "/api/submit-trivia-answer"
};
