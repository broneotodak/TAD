// Get answer breakdown by option (A, B, C, D) for a trivia question
// Feature: Trivia
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  try {
    const url = new URL(req.url);
    const questionId = url.searchParams.get('questionId');
    
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    if (!questionId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Question ID is required'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Get answer breakdown by option
    const breakdown = await sql`
      SELECT 
        answer,
        COUNT(*) as count,
        COUNT(CASE WHEN is_correct = true THEN 1 END) as correct_count
      FROM trivia_answers
      WHERE question_id = ${questionId}
      GROUP BY answer
      ORDER BY answer ASC
    `;

    // Get total answers
    const [totalStats] = await sql`
      SELECT 
        COUNT(*) as total_answers,
        COUNT(CASE WHEN is_correct = true THEN 1 END) as correct_answers,
        COUNT(CASE WHEN is_correct = false THEN 1 END) as incorrect_answers
      FROM trivia_answers
      WHERE question_id = ${questionId}
    `;

    const totalAnswers = parseInt(totalStats.total_answers || 0);
    const correctAnswers = parseInt(totalStats.correct_answers || 0);
    const incorrectAnswers = parseInt(totalStats.incorrect_answers || 0);

    // Format breakdown with percentages
    const answerBreakdown = {
      A: { count: 0, percentage: 0, correct: false },
      B: { count: 0, percentage: 0, correct: false },
      C: { count: 0, percentage: 0, correct: false },
      D: { count: 0, percentage: 0, correct: false }
    };

    breakdown.forEach(row => {
      const option = row.answer.toUpperCase();
      const count = parseInt(row.count || 0);
      const percentage = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
      
      if (answerBreakdown[option]) {
        answerBreakdown[option] = {
          count: count,
          percentage: percentage,
          correct: parseInt(row.correct_count || 0) > 0
        };
      }
    });

    return new Response(JSON.stringify({
      success: true,
      totalAnswers: totalAnswers,
      correctAnswers: correctAnswers,
      incorrectAnswers: incorrectAnswers,
      breakdown: answerBreakdown
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error getting answer breakdown:', error);
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
  path: "/api/get-trivia-answer-breakdown"
};
