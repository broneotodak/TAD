// Migrate initial participant data to database
import { neon } from '@neondatabase/serverless';

// Import the participant data
const attendanceData = [
  { id: 1, name: "Khairul Azlan Bin Zainal Ariffin", company: "THSB", vip: true, table: null, checkedIn: false },
  { id: 2, name: "Nur Hylen Shamirah Binti Nasharuddin", company: "HSB", vip: true, table: null, checkedIn: false },
  { id: 4, name: "Mohd Tariq Bin Ariffin Ali", company: "THSB", vip: true, table: null, checkedIn: false },
  { id: 5, name: "Ahmad Fadli bin Ahmad Dahlan", company: "TSSB", vip: true, table: null, checkedIn: false },
  // Note: Full data will be read from data.js in the frontend
];

export default async (req, context) => {
  // Add CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    console.log('Starting migration...');
    
    if (!process.env.NETLIFY_DATABASE_URL) {
      console.error('Database URL not found in environment');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Database URL not configured' 
      }), {
        status: 500,
        headers
      });
    }

    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    console.log('Database connection established');
    
    // Get participant data from request body (sent from frontend)
    const body = await req.text();
    console.log('Request body received, length:', body.length);
    
    const { participants } = JSON.parse(body);
    
    if (!participants || !Array.isArray(participants)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid data format. Please provide participants array.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let migrated = 0;
    let skipped = 0;

    // Insert participants (skip if already exists)
    for (const p of participants) {
      try {
        await sql`
          INSERT INTO participants (id, name, company, vip, table_number, checked_in)
          VALUES (${p.id}, ${p.name}, ${p.company}, ${p.vip}, ${p.table}, ${p.checkedIn || false})
          ON CONFLICT (id) DO NOTHING
        `;
        migrated++;
      } catch (error) {
        console.error(`Failed to migrate participant ${p.id}:`, error);
        skipped++;
      }
    }

    console.log(`Migration complete: ${migrated} migrated, ${skipped} skipped`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Data migration completed',
      migrated: migrated,
      skipped: skipped,
      total: participants.length
    }), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Migration error:', error);
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
  path: "/api/migrate-data"
};

