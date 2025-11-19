// Get all participants with table assignments
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    const participants = await sql`
      SELECT 
        id,
        name,
        company,
        vip,
        table_number as "table",
        checked_in as "checkedIn",
        checked_in_at as "checkedInAt"
      FROM participants
      ORDER BY id ASC
    `;
    
    const tables = await sql`
      SELECT 
        table_number as number,
        seats
      FROM tables_config
      ORDER BY table_number ASC
    `;

    return new Response(JSON.stringify({ 
      success: true,
      data: {
        participants,
        tables,
        lastUpdated: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Error fetching participants:', error);
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
  path: "/api/get-participants"
};

