// Save event information (schedule, menu, announcements)
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers });
  }

  try {
    const { key, value } = await req.json();
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    if (!key) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Key is required' 
      }), {
        status: 400,
        headers
      });
    }

    // Convert value to JSON string if it's an object/array
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);

    // Upsert setting
    await sql`
      INSERT INTO event_settings (key, value, updated_at)
      VALUES (${key}, ${valueStr}, CURRENT_TIMESTAMP)
      ON CONFLICT (key) 
      DO UPDATE SET 
        value = EXCLUDED.value,
        updated_at = CURRENT_TIMESTAMP
    `;

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Event info saved successfully'
    }), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error saving event info:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers
    });
  }
};

export const config = {
  path: "/api/save-event-info"
};

