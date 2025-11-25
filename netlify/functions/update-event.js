// Update an existing event
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const {
            id,
            name,
            eventType,
            date,
            venue,
            theme,
            timeStart,
            timeEnd,
            features,
            isActive
        } = await req.json();

        if (!id) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Event ID is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sql = neon(process.env.NETLIFY_DATABASE_URL);

        const [updatedEvent] = await sql`
      UPDATE events
      SET
        name = COALESCE(${name}, name),
        event_type = COALESCE(${eventType}, event_type),
        date = COALESCE(${date}, date),
        venue = COALESCE(${venue}, venue),
        theme = COALESCE(${theme}, theme),
        time_start = COALESCE(${timeStart}, time_start),
        time_end = COALESCE(${timeEnd}, time_end),
        features = COALESCE(${features ? JSON.stringify(features) : null}, features),
        is_active = COALESCE(${isActive}, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

        if (!updatedEvent) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Event not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Event updated successfully',
            event: {
                id: updatedEvent.id,
                name: updatedEvent.name,
                eventType: updatedEvent.event_type,
                date: updatedEvent.date,
                venue: updatedEvent.venue,
                theme: updatedEvent.theme,
                timeStart: updatedEvent.time_start,
                timeEnd: updatedEvent.time_end,
                features: updatedEvent.features,
                isActive: updatedEvent.is_active
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error updating event:', error);
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
    path: "/api/update-event"
};
