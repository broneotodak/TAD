// Migration: Add QR page note columns to events table
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
    try {
        const sql = neon(process.env.NETLIFY_DATABASE_URL);

        // Check if columns already exist
        const checkColumns = await sql`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'events'
            AND column_name IN ('qr_note_top', 'qr_note_bottom')
        `;

        const existingColumns = checkColumns.map(row => row.column_name);
        const results = [];

        // Add qr_note_top if not exists
        if (!existingColumns.includes('qr_note_top')) {
            await sql`ALTER TABLE events ADD COLUMN qr_note_top TEXT`;
            results.push('Added qr_note_top column');
        } else {
            results.push('qr_note_top column already exists');
        }

        // Add qr_note_bottom if not exists
        if (!existingColumns.includes('qr_note_bottom')) {
            await sql`ALTER TABLE events ADD COLUMN qr_note_bottom TEXT`;
            results.push('Added qr_note_bottom column');
        } else {
            results.push('qr_note_bottom column already exists');
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Migration completed',
            results
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Migration error:', error);

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
    path: "/api/add-qr-notes-columns"
};
