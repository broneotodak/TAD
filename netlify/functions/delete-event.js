// Delete an event and all related data
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers });
  }

  try {
    console.log('Delete event request received');
    const body = await req.text();
    const { id } = JSON.parse(body);
    console.log('Deleting event ID:', id);
    
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    if (!id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Event ID is required' 
      }), {
        status: 400,
        headers
      });
    }

    // First, verify the event exists
    const [event] = await sql`
      SELECT id, name FROM events WHERE id = ${id}
    `;

    if (!event) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Event not found' 
      }), {
        status: 404,
        headers
      });
    }

    // Delete related data in order (to respect foreign key constraints)
    // 1. Delete lucky draw winners for this event
    await sql`
      DELETE FROM lucky_draw_winners 
      WHERE event_id = ${id}
    `;
    console.log('Deleted lucky draw winners for event', id);

    // 2. Delete participants for this event
    await sql`
      DELETE FROM participants 
      WHERE event_id = ${id}
    `;
    console.log('Deleted participants for event', id);

    // 3. Delete tables config for this event
    await sql`
      DELETE FROM tables_config 
      WHERE event_id = ${id}
    `;
    console.log('Deleted tables config for event', id);

    // 4. Finally, delete the event itself
    const result = await sql`
      DELETE FROM events 
      WHERE id = ${id}
      RETURNING id, name
    `;

    console.log('Successfully deleted event:', result[0]);

    return new Response(JSON.stringify({ 
      success: true,
      deleted: result[0]
    }), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error deleting event:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers
    });
  }
};

export const config = {
  path: "/api/delete-event"
};

