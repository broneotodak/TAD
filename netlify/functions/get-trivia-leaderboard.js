// Get trivia leaderboard for a session
// Feature: Trivia
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');
    
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

    // Get all participants with their total points
    // Use tiebreaker: total_points DESC, correct_answers DESC, earliest first answer time ASC
    // Points already include time bonus (remaining seconds), so scores should be unique
    const leaderboard = await sql`
      SELECT 
        p.id,
        p.name,
        p.company,
        COALESCE(SUM(ta.points_earned), 0) as total_points,
        COUNT(ta.id) as questions_answered,
        COUNT(CASE WHEN ta.is_correct = true THEN 1 END) as correct_answers,
        MIN(ta.answered_at) as first_answer_time
      FROM participants p
      INNER JOIN trivia_answers ta ON ta.participant_id = p.id
      INNER JOIN trivia_questions tq ON tq.id = ta.question_id
      WHERE tq.session_id = ${sessionId}
      GROUP BY p.id, p.name, p.company
      HAVING COUNT(ta.id) > 0
      ORDER BY 
        total_points DESC, 
        correct_answers DESC,
        first_answer_time ASC
      LIMIT 10
    `;

    return new Response(JSON.stringify({
      success: true,
      leaderboard: leaderboard.map((entry, index) => ({
        rank: index + 1,
        participantId: entry.id,
        name: entry.name,
        company: entry.company,
        totalPoints: parseInt(entry.total_points || 0),
        questionsAnswered: parseInt(entry.questions_answered || 0),
        correctAnswers: parseInt(entry.correct_answers || 0)
      }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error getting trivia leaderboard:', error);
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
  path: "/api/get-trivia-leaderboard"
};
