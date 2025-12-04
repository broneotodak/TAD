// Get statistics for current trivia question (answer count, etc.)
// Feature: Trivia
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  try {
    const url = new URL(req.url);
    const questionId = url.searchParams.get('questionId');
    const sessionId = url.searchParams.get('sessionId');
    
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    if (!questionId && !sessionId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Question ID or Session ID is required'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    let questionIdToCheck = questionId;
    
    // If sessionId provided, get current question
    if (sessionId && !questionId) {
      const [session] = await sql`
        SELECT current_question_index FROM trivia_sessions WHERE id = ${sessionId}
      `;
      
      if (session && session.current_question_index !== null) {
        const [question] = await sql`
          SELECT id FROM trivia_questions
          WHERE session_id = ${sessionId}
          ORDER BY question_order ASC
          LIMIT 1 OFFSET ${session.current_question_index}
        `;
        if (question) {
          questionIdToCheck = question.id;
        }
      }
    }

    if (!questionIdToCheck) {
      return new Response(JSON.stringify({
        success: true,
        answerCount: 0,
        correctCount: 0,
        incorrectCount: 0
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Get answer statistics
    const [stats] = await sql`
      SELECT 
        COUNT(*) as total_answers,
        COUNT(CASE WHEN is_correct = true THEN 1 END) as correct_answers,
        COUNT(CASE WHEN is_correct = false THEN 1 END) as incorrect_answers
      FROM trivia_answers
      WHERE question_id = ${questionIdToCheck}
    `;

    return new Response(JSON.stringify({
      success: true,
      answerCount: parseInt(stats.total_answers || 0),
      correctCount: parseInt(stats.correct_answers || 0),
      incorrectCount: parseInt(stats.incorrect_answers || 0)
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error getting question stats:', error);
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
  path: "/api/get-trivia-question-stats"
};
