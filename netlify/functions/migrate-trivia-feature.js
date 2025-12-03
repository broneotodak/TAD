// Migration script to add Trivia feature
// ROLLBACK: Use rollback-trivia-feature.js to remove
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    console.log('Starting Trivia feature migration...');
    
    // Step 1: Create trivia_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS trivia_sessions (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT false,
        started_at TIMESTAMP,
        ended_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ trivia_sessions table created');
    
    // Step 2: Create trivia_questions table
    await sql`
      CREATE TABLE IF NOT EXISTS trivia_questions (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES trivia_sessions(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_answer CHAR(1) CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
        question_order INTEGER NOT NULL,
        time_limit_seconds INTEGER DEFAULT 30,
        points INTEGER DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(session_id, question_order)
      )
    `;
    console.log('✓ trivia_questions table created');
    
    // Step 3: Create trivia_answers table
    await sql`
      CREATE TABLE IF NOT EXISTS trivia_answers (
        id SERIAL PRIMARY KEY,
        question_id INTEGER REFERENCES trivia_questions(id) ON DELETE CASCADE,
        participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE,
        answer CHAR(1) CHECK (answer IN ('A', 'B', 'C', 'D')),
        is_correct BOOLEAN NOT NULL,
        answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        points_earned INTEGER DEFAULT 0,
        UNIQUE(question_id, participant_id)
      )
    `;
    console.log('✓ trivia_answers table created');
    
    // Step 4: Create indexes for performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_trivia_sessions_event 
      ON trivia_sessions(event_id)
    `;
    console.log('✓ Index on trivia_sessions.event_id created');
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_trivia_questions_session 
      ON trivia_questions(session_id)
    `;
    console.log('✓ Index on trivia_questions.session_id created');
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_trivia_answers_question 
      ON trivia_answers(question_id)
    `;
    console.log('✓ Index on trivia_answers.question_id created');
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_trivia_answers_participant 
      ON trivia_answers(participant_id)
    `;
    console.log('✓ Index on trivia_answers.participant_id created');
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_trivia_answers_answered_at 
      ON trivia_answers(answered_at)
    `;
    console.log('✓ Index on trivia_answers.answered_at created');
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Trivia feature migration completed successfully',
      tables_created: [
        'trivia_sessions',
        'trivia_questions', 
        'trivia_answers'
      ],
      indexes_created: 5
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Trivia migration error:', error);
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
  path: "/api/migrate-trivia-feature"
};
