// Bulk add participants to an event
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const { eventId, participants } = await req.json();

        if (!eventId || !participants || !Array.isArray(participants)) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Event ID and participants array are required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sql = neon(process.env.NETLIFY_DATABASE_URL);

        // Get the highest existing ID for this event
        const [maxIdResult] = await sql`
      SELECT COALESCE(MAX(id), 0) as max_id FROM participants
    `;
        let nextId = parseInt(maxIdResult.max_id) + 1;

        // Insert all participants
        const insertedParticipants = [];
        for (const p of participants) {
            const [inserted] = await sql`
        INSERT INTO participants (
          id,
          name,
          company,
          vip,
          table_number,
          event_id,
          checked_in
        )
        VALUES (
          ${nextId},
          ${p.name},
          ${p.company || ''},
          ${p.vip || false},
          ${p.table || null},
          ${eventId},
          false
        )
        RETURNING id, name, company, vip, table_number as "table"
      `;
            insertedParticipants.push(inserted);
            nextId++;
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Successfully added ${insertedParticipants.length} participants`,
            participants: insertedParticipants,
            count: insertedParticipants.length
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error adding participants:', error);
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
    path: "/api/add-participants-bulk"
};
