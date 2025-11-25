// Get a single event by ID
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
    try {
        const url = new URL(req.url);
        const eventId = url.searchParams.get('id');

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

        const [event] = await sql`
      SELECT 
        id,
        name,
        event_type as "eventType",
        date,
        venue,
        theme,
        time_start as "timeStart",
        time_end as "timeEnd",
        CONCAT(time_start, ' - ', time_end) as "time",
        tentative,
        menu,
        features,
        is_active as "isActive",
        created_at as "createdAt",
        card_icon_url as "cardIconUrl",
        card_background_url as "cardBackgroundUrl"
      FROM events
      WHERE id = ${eventId}
    `;

        if (!event) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Event not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Normalize features to use snake_case
        if (event.features) {
            if ('luckyDraw' in event.features) {
                event.features.lucky_draw = event.features.luckyDraw;
                delete event.features.luckyDraw;
            }
        }

        return new Response(JSON.stringify({
            success: true,
            event
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

    } catch (error) {
        console.error('Error fetching event:', error);
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
    path: "/api/get-event"
};
