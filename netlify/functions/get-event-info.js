// Get event information (schedule, menu, announcements)
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache'
  };

  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    // Get all event settings
    const settings = await sql`
      SELECT key, value 
      FROM event_settings
    `;
    
    // Convert to object
    const eventInfo = {};
    settings.forEach(s => {
      try {
        eventInfo[s.key] = JSON.parse(s.value);
      } catch {
        eventInfo[s.key] = s.value;
      }
    });

    return new Response(JSON.stringify({ 
      success: true,
      data: eventInfo
    }), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error fetching event info:', error);
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
  path: "/api/get-event-info"
};

