// Save/update participants and tables
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { participants, tables } = await req.json();
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    // Begin transaction-like operations
    
    // 1. Upsert participants
    for (const p of participants) {
      await sql`
        INSERT INTO participants (id, name, company, vip, table_number, checked_in, checked_in_at)
        VALUES (${p.id}, ${p.name}, ${p.company}, ${p.vip}, ${p.table}, ${p.checkedIn}, ${p.checkedInAt || null})
        ON CONFLICT (id) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          company = EXCLUDED.company,
          vip = EXCLUDED.vip,
          table_number = EXCLUDED.table_number,
          checked_in = EXCLUDED.checked_in,
          checked_in_at = EXCLUDED.checked_in_at,
          updated_at = CURRENT_TIMESTAMP
      `;
    }
    
    // 2. Clear and insert tables config
    await sql`DELETE FROM tables_config`;
    
    for (const t of tables) {
      await sql`
        INSERT INTO tables_config (table_number, seats)
        VALUES (${t.number}, ${t.seats})
      `;
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Data saved successfully',
      participantsCount: participants.length,
      tablesCount: tables.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error saving data:', error);
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
  path: "/api/save-participants"
};

