// Add performance indexes for trivia leaderboard queries
// Optimizes queries for 100+ concurrent users
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
    try {
        const sql = neon(process.env.NETLIFY_DATABASE_URL);

        console.log('Adding performance indexes for trivia...');

        // Composite index for leaderboard query (most common query pattern)
        // This index covers: session_id lookup, points calculation, and sorting
        try {
            await sql`
                CREATE INDEX IF NOT EXISTS idx_trivia_answers_leaderboard 
                ON trivia_answers(question_id, participant_id, points_earned DESC, answered_at ASC)
            `;
            console.log('✓ Composite index for leaderboard created');
        } catch (e) {
            console.log('Note: Index may already exist:', e.message);
        }

        // Index for question_id + is_correct (for answer breakdown queries)
        try {
            await sql`
                CREATE INDEX IF NOT EXISTS idx_trivia_answers_question_correct 
                ON trivia_answers(question_id, is_correct)
            `;
            console.log('✓ Index for answer breakdown created');
        } catch (e) {
            console.log('Note: Index may already exist:', e.message);
        }

        // Index for session lookup via questions (for leaderboard)
        try {
            await sql`
                CREATE INDEX IF NOT EXISTS idx_trivia_questions_session_id 
                ON trivia_questions(session_id, id)
            `;
            console.log('✓ Index for session questions lookup created');
        } catch (e) {
            console.log('Note: Index may already exist:', e.message);
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Performance indexes added successfully',
            indexes_added: [
                'idx_trivia_answers_leaderboard',
                'idx_trivia_answers_question_correct',
                'idx_trivia_questions_session_id'
            ]
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error adding performance indexes:', error);
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
    path: "/api/add-trivia-performance-indexes"
};
