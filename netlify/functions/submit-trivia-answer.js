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
    // Use unique constraint check - more efficient for high concurrency
    // The UNIQUE(question_id, participant_id) constraint will prevent duplicates
    const [existing] = await sql`
      SELECT id FROM trivia_answers
      WHERE question_id = ${questionId} AND participant_id = ${participantId}
      LIMIT 1
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
      SELECT correct_answer, points, session_id, time_limit_seconds
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
    
    // Get question start time for timer-based scoring
    // Use a single query to get session info and calculate points atomically
    const [sessionInfo] = await sql`
      SELECT question_started_at, current_question_index
      FROM trivia_sessions
      WHERE id = ${question.session_id}
    `;
    
    // Calculate points with timer bonus using database timestamp for precision
    // This ensures all users get scored consistently even under high concurrency
    let pointsEarned = 0;
    if (isCorrect) {
      if (sessionInfo?.question_started_at) {
        // Use database NOW() for precise timestamp calculation
        // This ensures scoring is consistent across all concurrent submissions
        // Pass the question_started_at as a parameter to SQL
        const [scoringResult] = await sql`
          SELECT 
            EXTRACT(EPOCH FROM (NOW() - ${sessionInfo.question_started_at}::timestamp))::integer as elapsed_seconds,
            ${question.time_limit_seconds}::integer as time_limit
        `;
        
        const elapsedSeconds = scoringResult?.elapsed_seconds || 0;
        const remainingSeconds = Math.max(0, question.time_limit_seconds - elapsedSeconds);
        
        // Base points + remaining seconds bonus
        // Faster answers get more points (more remaining seconds)
        // Example: 10 base points + 25 remaining seconds = 35 points
        pointsEarned = question.points + remainingSeconds;
      } else {
        // Fallback: if timer not started, just give base points
        pointsEarned = question.points;
      }
    }
    // Wrong answer = 0 points (already set)

    // Insert answer with database timestamp (answered_at uses DEFAULT CURRENT_TIMESTAMP)
    // This ensures precise timestamp for tie-breaking in leaderboard
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
