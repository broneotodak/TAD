// Add is_visible column to events table
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
    try {
        const sql = neon(process.env.NETLIFY_DATABASE_URL);

        console.log('Adding is_visible column to events table...');

        // Add is_visible column (default true for existing events)
        try {
            await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true`;
            console.log('✓ Added is_visible column');
            
            // Set all existing events to visible if they don't have a value
            await sql`UPDATE events SET is_visible = true WHERE is_visible IS NULL`;
            console.log('✓ Set default visibility for existing events');
        } catch (e) {
            console.log('✓ is_visible column already exists or error:', e.message);
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Schema updated successfully - added is_visible column'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Schema update error:', error);
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
    path: "/api/add-visibility-column"
};
