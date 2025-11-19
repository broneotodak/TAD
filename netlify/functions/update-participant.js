// Update a single participant
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { id, name, company, vip, table } = await req.json();
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    if (!id || !name) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'ID and name are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await sql`
      UPDATE participants 
      SET 
        name = ${name},
        company = ${company || ''},
        vip = ${vip || false},
        table_number = ${table || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Participant not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      participant: result[0]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating participant:', error);
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
  path: "/api/update-participant"
};

