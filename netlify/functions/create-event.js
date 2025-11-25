// Create a new event
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const {
            name,
            eventType,
            date,
            venue,
            theme,
            timeStart,
            timeEnd,
            features,
            tentative,
            menu
        } = await req.json();

        const sql = neon(process.env.NETLIFY_DATABASE_URL);

        // Validate required fields
        if (!name || !eventType || !date) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Name, event type, and date are required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Create the event
        const [newEvent] = await sql`
      INSERT INTO events (
        name,
        event_type,
        date,
        venue,
        theme,
        time_start,
        time_end,
        features,
        tentative,
        menu,
        is_active
      )
      VALUES (
        ${name},
        ${eventType},
        ${date},
        ${venue || null},
        ${theme || null},
        ${timeStart || null},
        ${timeEnd || null},
        ${JSON.stringify(features || { attendance: true, tables: true, luckyDraw: true })},
        ${tentative || null},
        ${menu || null},
        true
      )
      RETURNING *
    `;

        return new Response(JSON.stringify({
            success: true,
            message: 'Event created successfully',
            event: {
                id: newEvent.id,
                name: newEvent.name,
                eventType: newEvent.event_type,
                date: newEvent.date,
                venue: newEvent.venue,
                theme: newEvent.theme,
                timeStart: newEvent.time_start,
                timeEnd: newEvent.time_end,
                features: newEvent.features,
                tentative: newEvent.tentative,
                menu: newEvent.menu,
                isActive: newEvent.is_active,
                createdAt: newEvent.created_at
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error creating event:', error);
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
    path: "/api/create-event"
};
