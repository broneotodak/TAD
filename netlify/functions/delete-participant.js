// Delete a participant
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { id } = await req.json();
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    if (!id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await sql`
      DELETE FROM participants 
      WHERE id = ${id}
      RETURNING id, name
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
      deleted: result[0]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting participant:', error);
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
  path: "/api/delete-participant"
};

