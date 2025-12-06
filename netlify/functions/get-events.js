// Get all events (admin view)
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
    try {
        const sql = neon(process.env.NETLIFY_DATABASE_URL);

        // Get all events with participant counts
        const events = await sql`
      SELECT 
        e.id,
        e.name,
        e.event_type as "eventType",
        e.date,
        e.venue,
        e.theme,
        e.time_start as "timeStart",
        e.time_end as "timeEnd",
        e.features,
        e.is_active as "isActive",
        COALESCE(e.is_visible, true) as "isVisible",
        e.created_at as "createdAt",
        e.card_icon_url as "cardIconUrl",
        e.card_background_url as "cardBackgroundUrl",
        COUNT(DISTINCT p.id) as "participantCount",
        COUNT(DISTINCT CASE WHEN p.checked_in = true THEN p.id END) as "checkedInCount",
        COUNT(DISTINCT t.id) as "tableCount"
      FROM events e
      LEFT JOIN participants p ON p.event_id = e.id
      LEFT JOIN tables_config t ON t.event_id = e.id
      GROUP BY e.id
      ORDER BY e.date DESC, e.created_at DESC
    `;

        return new Response(JSON.stringify({
            success: true,
            events: events.map(e => ({
                ...e,
                participantCount: parseInt(e.participantCount) || 0,
                checkedInCount: parseInt(e.checkedInCount) || 0,
                tableCount: parseInt(e.tableCount) || 0
            }))
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

    } catch (error) {
        console.error('Error fetching events:', error);
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
    path: "/api/get-events"
};
