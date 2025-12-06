// Toggle event visibility and active status
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers });
    }

    try {
        const body = await req.text();
        const { id } = JSON.parse(body);
        
        if (!id) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: 'Event ID is required' 
            }), {
                status: 400,
                headers
            });
        }

        const sql = neon(process.env.NETLIFY_DATABASE_URL);
        
        // Get current visibility status
        const [event] = await sql`
            SELECT id, name, is_visible, is_active 
            FROM events 
            WHERE id = ${id}
        `;

        if (!event) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: 'Event not found' 
            }), {
                status: 404,
                headers
            });
        }

        // Toggle visibility: if hiding, also set is_active to false
        // If showing, set is_active to true
        const newVisibility = !event.is_visible;
        const newActiveStatus = newVisibility ? true : false;

        const [updated] = await sql`
            UPDATE events 
            SET 
                is_visible = ${newVisibility},
                is_active = ${newActiveStatus},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id}
            RETURNING id, name, is_visible, is_active
        `;

        return new Response(JSON.stringify({ 
            success: true,
            event: updated,
            message: newVisibility 
                ? `Event "${updated.name}" is now visible on the main page` 
                : `Event "${updated.name}" is now hidden from the main page`
        }), {
            status: 200,
            headers
        });

    } catch (error) {
        console.error('Error toggling event visibility:', error);
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
    path: "/api/toggle-event-visibility"
};
