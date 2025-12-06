// Get trivia session with questions
// Feature: Trivia (can be disabled via event features)
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  try {
    const url = new URL(req.url);
    const eventIdParam = url.searchParams.get('eventId');
    const sessionId = url.searchParams.get('sessionId');
    
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    if (!eventIdParam && !sessionId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Event ID or Session ID is required'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Convert eventId to integer to ensure proper matching
    const eventId = eventIdParam ? parseInt(eventIdParam, 10) : null;

    let session;
    if (sessionId) {
      // Get specific session
      [session] = await sql`
        SELECT * FROM trivia_sessions WHERE id = ${parseInt(sessionId, 10)}
      `;
    } else if (eventId) {
      // Get active session for event first
      [session] = await sql`
        SELECT * FROM trivia_sessions 
        WHERE event_id = ${eventId} AND is_active = true
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      // If no active session, get the most recent session (even if inactive)
      if (!session) {
        [session] = await sql`
          SELECT * FROM trivia_sessions 
          WHERE event_id = ${eventId}
          ORDER BY created_at DESC
          LIMIT 1
        `;
      }
    }

    if (!session) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Trivia session not found',
        session: null,
        questions: []
      }), {
        status: 200, // Return 200 with success: false so frontend can handle gracefully
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Get questions for this session
    // Include correct_answer if timer has ended for the current question
    const currentQuestionIndex = session.current_question_index;
    const questionStartedAt = session.question_started_at;
    
    let questions;
    if (currentQuestionIndex !== null && questionStartedAt) {
      // Check if timer has ended for current question
      const [currentQuestion] = await sql`
        SELECT time_limit_seconds
        FROM trivia_questions
        WHERE session_id = ${session.id}
        ORDER BY question_order ASC
        LIMIT 1 OFFSET ${currentQuestionIndex}
      `;
      
      const timerEnded = currentQuestion && (() => {
        const startedAt = new Date(questionStartedAt);
        const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
        return elapsed >= currentQuestion.time_limit_seconds;
      })();
      
      // Include correct_answer if timer ended or session ended
      if (timerEnded || !session.is_active) {
        questions = await sql`
          SELECT 
            id,
            question_text as "questionText",
            option_a as "optionA",
            option_b as "optionB",
            option_c as "optionC",
            option_d as "optionD",
            question_order as "questionOrder",
            time_limit_seconds as "timeLimitSeconds",
            points,
            correct_answer as "correctAnswer"
          FROM trivia_questions
          WHERE session_id = ${session.id}
          ORDER BY question_order ASC
        `;
      } else {
        // Timer still active - don't include correct_answer
        questions = await sql`
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
          WHERE session_id = ${session.id}
          ORDER BY question_order ASC
        `;
      }
    } else {
      // No question started yet - don't include correct_answer
      questions = await sql`
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
        WHERE session_id = ${session.id}
        ORDER BY question_order ASC
      `;
    }

    // Get participant count (if session is active)
    let participantCount = 0;
    if (session.is_active && questions.length > 0) {
      const [count] = await sql`
        SELECT COUNT(DISTINCT participant_id) as count
        FROM trivia_answers
        WHERE question_id IN (
          SELECT id FROM trivia_questions WHERE session_id = ${session.id}
        )
      `;
      participantCount = parseInt(count?.count || 0);
    }

    // Ensure isActive is a boolean (PostgreSQL returns true/false, but ensure it's explicit)
    const isActive = session.is_active === true || session.is_active === 'true' || session.is_active === 1;
    
    console.log('Session data:', {
      id: session.id,
      event_id: session.event_id,
      is_active: session.is_active,
      is_active_type: typeof session.is_active,
      isActive_computed: isActive
    });

    return new Response(JSON.stringify({
      success: true,
      session: {
        id: session.id,
        eventId: session.event_id,
        title: session.title,
        isActive: isActive,
        startedAt: session.started_at,
        endedAt: session.ended_at,
        createdAt: session.created_at,
        participantCount: participantCount,
        currentQuestionIndex: session.current_question_index ?? null,
        questionStartedAt: session.question_started_at ?? null
      },
      questions: questions.map(q => ({
        id: q.id,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        questionOrder: q.questionOrder,
        timeLimitSeconds: q.timeLimitSeconds,
        points: q.points,
        correctAnswer: q.correctAnswer || null // Only included when timer ended or session completed
      }))
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error getting trivia session:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

export const config = {
  path: "/api/get-trivia-session"
};
