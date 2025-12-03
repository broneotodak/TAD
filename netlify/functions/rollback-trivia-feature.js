// ROLLBACK script to remove Trivia feature
// This will DELETE all trivia data and tables
// WARNING: This is irreversible once executed!
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    // Require confirmation parameter
    const { confirm } = await req.json();
    if (confirm !== 'DELETE_TRIVIA_DATA') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Rollback requires confirmation. Send { "confirm": "DELETE_TRIVIA_DATA" }' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('⚠️ Starting Trivia feature rollback...');
    console.log('⚠️ This will DELETE all trivia data!');
    
    // Step 1: Drop indexes first
    try {
      await sql`DROP INDEX IF EXISTS idx_trivia_answers_answered_at`;
      await sql`DROP INDEX IF EXISTS idx_trivia_answers_participant`;
      await sql`DROP INDEX IF EXISTS idx_trivia_answers_question`;
      await sql`DROP INDEX IF EXISTS idx_trivia_questions_session`;
      await sql`DROP INDEX IF EXISTS idx_trivia_sessions_event`;
      console.log('✓ Indexes dropped');
    } catch (e) {
      console.log('Note: Some indexes may not exist:', e.message);
    }
    
    // Step 2: Drop tables in reverse dependency order
    await sql`DROP TABLE IF EXISTS trivia_answers CASCADE`;
    console.log('✓ trivia_answers table dropped');
    
    await sql`DROP TABLE IF EXISTS trivia_questions CASCADE`;
    console.log('✓ trivia_questions table dropped');
    
    await sql`DROP TABLE IF EXISTS trivia_sessions CASCADE`;
    console.log('✓ trivia_sessions table dropped');
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Trivia feature rollback completed. All trivia data has been deleted.',
      warning: 'This action cannot be undone. All trivia sessions, questions, and answers have been permanently deleted.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Rollback error:', error);
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
  path: "/api/rollback-trivia-feature"
};
