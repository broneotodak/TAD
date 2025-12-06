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

    // Get total questions count for this session
    const [totalQuestionsResult] = await sql`
      SELECT COUNT(*) as total_questions
      FROM trivia_questions
      WHERE session_id = ${sessionId}
    `;
    const totalQuestions = parseInt(totalQuestionsResult?.total_questions || 0);

    // Get all participants with their total points and average answer time
    // Optimized query for 100+ concurrent users
    // Use tiebreaker: total_points DESC, correct_answers DESC, earliest first answer time ASC
    // Points already include time bonus (remaining seconds), so scores should be unique
    // Database timestamp (answered_at) ensures precise tie-breaking for fastest answers
    // Calculate average time: time from first answer to last answer, divided by number of questions
    const leaderboard = await sql`
      SELECT 
        p.id,
        p.name,
        p.company,
        COALESCE(SUM(ta.points_earned), 0) as total_points,
        COUNT(ta.id) as questions_answered,
        COUNT(CASE WHEN ta.is_correct = true THEN 1 END) as correct_answers,
        MIN(ta.answered_at) as first_answer_time,
        MAX(ta.answered_at) as last_answer_time,
        -- Calculate average time per question in milliseconds
        -- Time from first answer to last answer, divided by number of questions
        -- This gives us average time spent per question
        CASE 
          WHEN COUNT(ta.id) > 1 THEN
            EXTRACT(EPOCH FROM (MAX(ta.answered_at) - MIN(ta.answered_at))) * 1000 / COUNT(ta.id)
          ELSE 0
        END::integer as avg_answer_time_ms
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
      totalQuestions: totalQuestions,
      leaderboard: leaderboard.map((entry, index) => ({
        rank: index + 1,
        participantId: entry.id,
        name: entry.name,
        company: entry.company,
        totalPoints: parseInt(entry.total_points || 0),
        questionsAnswered: parseInt(entry.questions_answered || 0),
        correctAnswers: parseInt(entry.correct_answers || 0),
        avgAnswerTimeMs: parseInt(entry.avg_answer_time_ms || 0)
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
