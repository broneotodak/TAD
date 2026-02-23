// Save/update participants and tables
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { eventId, participants, tables } = await req.json();

    if (!eventId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Event ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    // Fix tables_config unique constraint for multi-event support
    // The old constraint was on table_number alone, needs to be (table_number, event_id)
    try {
      await sql`ALTER TABLE tables_config DROP CONSTRAINT IF EXISTS tables_config_table_number_key`;
      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'tables_config_table_number_event_id_key'
          ) THEN
            ALTER TABLE tables_config
              ADD CONSTRAINT tables_config_table_number_event_id_key
              UNIQUE (table_number, event_id);
          END IF;
        END $$
      `;
    } catch (constraintError) {
      console.log('Constraint migration note:', constraintError.message);
    }

    // 1. Upsert participants
    for (const p of participants) {
      await sql`
        INSERT INTO participants (id, name, company, vip, table_number, checked_in, checked_in_at, event_id)
        VALUES (${p.id}, ${p.name}, ${p.company}, ${p.vip}, ${p.table}, ${p.checkedIn}, ${p.checkedInAt || null}, ${eventId})
        ON CONFLICT (id)
        DO UPDATE SET
          name = EXCLUDED.name,
          company = EXCLUDED.company,
          vip = EXCLUDED.vip,
          table_number = EXCLUDED.table_number,
          checked_in = EXCLUDED.checked_in,
          checked_in_at = EXCLUDED.checked_in_at,
          event_id = EXCLUDED.event_id,
          updated_at = CURRENT_TIMESTAMP
      `;
    }

    // 2. Clear and insert tables config for this event
    await sql`DELETE FROM tables_config WHERE event_id = ${eventId}`;

    for (const t of tables) {
      await sql`
        INSERT INTO tables_config (table_number, seats, event_id, is_vip)
        VALUES (${t.number}, ${t.seats}, ${eventId}, ${t.isVip || false})
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

