// Migration script to add multi-event support
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    console.log('Starting multi-event migration...');
    
    // Step 1: Create events table
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        event_type VARCHAR(100),
        date DATE,
        venue VARCHAR(255),
        theme VARCHAR(255),
        time_start TIME,
        time_end TIME,
        features JSONB DEFAULT '{"attendance": true, "tables": true, "luckyDraw": true}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ Events table created');
    
    // Step 2: Check if default event exists
    const existingEvents = await sql`SELECT id FROM events WHERE name = 'Todak Annual Dinner 2025'`;
    
    let defaultEventId;
    if (existingEvents.length === 0) {
      // Create default event for existing data
      const [defaultEvent] = await sql`
        INSERT INTO events (
          name, 
          event_type, 
          date, 
          venue, 
          theme, 
          time_start, 
          time_end,
          features,
          is_active
        )
        VALUES (
          'Todak Annual Dinner 2025',
          'Annual Dinner',
          '2025-12-08',
          'DoubleTree by Hilton Putrajaya Lakeside',
          'Dress to Kill',
          '18:00:00',
          '23:00:00',
          '{"attendance": true, "tables": true, "luckyDraw": true}',
          true
        )
        RETURNING id
      `;
      defaultEventId = defaultEvent.id;
      console.log(`✓ Default event created with ID: ${defaultEventId}`);
    } else {
      defaultEventId = existingEvents[0].id;
      console.log(`✓ Default event already exists with ID: ${defaultEventId}`);
    }
    
    // Step 3: Add event_id column to participants if not exists
    try {
      await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS event_id INTEGER REFERENCES events(id)`;
      console.log('✓ Added event_id to participants table');
    } catch (e) {
      console.log('✓ event_id column already exists in participants');
    }
    
    // Step 4: Add event_id column to tables_config if not exists
    try {
      await sql`ALTER TABLE tables_config ADD COLUMN IF NOT EXISTS event_id INTEGER REFERENCES events(id)`;
      console.log('✓ Added event_id to tables_config table');
    } catch (e) {
      console.log('✓ event_id column already exists in tables_config');
    }
    
    // Step 5: Add event_id column to lucky_draw_winners if not exists
    try {
      await sql`ALTER TABLE lucky_draw_winners ADD COLUMN IF NOT EXISTS event_id INTEGER REFERENCES events(id)`;
      console.log('✓ Added event_id to lucky_draw_winners table');
    } catch (e) {
      console.log('✓ event_id column already exists in lucky_draw_winners');
    }
    
    // Step 6: Update existing records to link to default event
    const participantsUpdated = await sql`
      UPDATE participants 
      SET event_id = ${defaultEventId} 
      WHERE event_id IS NULL
    `;
    console.log(`✓ Updated ${participantsUpdated.length} participants to default event`);
    
    const tablesUpdated = await sql`
      UPDATE tables_config 
      SET event_id = ${defaultEventId} 
      WHERE event_id IS NULL
    `;
    console.log(`✓ Updated ${tablesUpdated.length} tables to default event`);
    
    const winnersUpdated = await sql`
      UPDATE lucky_draw_winners 
      SET event_id = ${defaultEventId} 
      WHERE event_id IS NULL
    `;
    console.log(`✓ Updated ${winnersUpdated.length} winners to default event`);
    
    // Step 7: Get migration summary
    const eventCount = await sql`SELECT COUNT(*) as count FROM events`;
    const participantCount = await sql`SELECT COUNT(*) as count FROM participants WHERE event_id = ${defaultEventId}`;
    const tableCount = await sql`SELECT COUNT(*) as count FROM tables_config WHERE event_id = ${defaultEventId}`;
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Multi-event migration completed successfully',
      summary: {
        defaultEventId,
        totalEvents: parseInt(eventCount[0].count),
        participantsMigrated: parseInt(participantCount[0].count),
        tablesMigrated: parseInt(tableCount[0].count),
        winnersMigrated: winnersUpdated.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = {
  path: "/api/migrate-to-multi-event"
};
