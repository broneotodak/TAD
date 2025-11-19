// Test database connection
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    // Simple query to test connection
    const result = await sql`SELECT NOW() as current_time, version() as postgres_version`;
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Database connection successful!',
      data: result[0],
      env_available: !!process.env.NETLIFY_DATABASE_URL
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Database test error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      stack: error.stack,
      env_available: !!process.env.NETLIFY_DATABASE_URL
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
  path: "/api/test-db"
};

