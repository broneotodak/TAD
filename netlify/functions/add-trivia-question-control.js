// Migration: Add question control fields to trivia_sessions
// Adds: current_question_index, question_started_at
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    console.log('Adding question control fields to trivia_sessions...');
    
    // Add current_question_index column (NULL means no question active)
    await sql`
      ALTER TABLE trivia_sessions 
      ADD COLUMN IF NOT EXISTS current_question_index INTEGER DEFAULT NULL
    `;
    console.log('✓ Added current_question_index column');
    
    // Add question_started_at timestamp
    await sql`
      ALTER TABLE trivia_sessions 
      ADD COLUMN IF NOT EXISTS question_started_at TIMESTAMP DEFAULT NULL
    `;
    console.log('✓ Added question_started_at column');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Question control fields added successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error adding question control fields:', error);
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
  path: "/api/add-trivia-question-control"
};
