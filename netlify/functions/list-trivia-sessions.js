// List all trivia sessions for an event
// Feature: Trivia
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  try {
    const url = new URL(req.url);
    const eventId = url.searchParams.get('eventId');
    
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    if (!eventId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Event ID is required'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Get all sessions for this event
    const sessions = await sql`
      SELECT 
        ts.id,
        ts.event_id as "eventId",
        ts.title,
        ts.is_active as "isActive",
        ts.started_at as "startedAt",
        ts.ended_at as "endedAt",
        ts.created_at as "createdAt",
        ts.current_question_index as "currentQuestionIndex",
        COUNT(tq.id) as question_count
      FROM trivia_sessions ts
      LEFT JOIN trivia_questions tq ON tq.session_id = ts.id
      WHERE ts.event_id = ${eventId}
      GROUP BY ts.id
      ORDER BY ts.created_at DESC
    `;

    return new Response(JSON.stringify({
      success: true,
      sessions: sessions.map(s => ({
        id: s.id,
        eventId: s.eventId,
        title: s.title,
        isActive: s.isActive,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        createdAt: s.createdAt,
        currentQuestionIndex: s.currentQuestionIndex,
        questionCount: parseInt(s.question_count || 0)
      }))
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error listing trivia sessions:', error);
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
  path: "/api/list-trivia-sessions"
};
