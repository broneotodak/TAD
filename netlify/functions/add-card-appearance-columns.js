// Migration: Add card appearance columns to events table
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
    try {
        const sql = neon(process.env.NETLIFY_DATABASE_URL);

        // Check if columns already exist
        const checkColumns = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'events' 
            AND column_name IN ('card_icon_url', 'card_background_url')
        `;

        const existingColumns = checkColumns.map(row => row.column_name);
        const results = [];

        // Add card_icon_url if not exists
        if (!existingColumns.includes('card_icon_url')) {
            await sql`ALTER TABLE events ADD COLUMN card_icon_url TEXT`;
            results.push('Added card_icon_url column');
        } else {
            results.push('card_icon_url column already exists');
        }

        // Add card_background_url if not exists
        if (!existingColumns.includes('card_background_url')) {
            await sql`ALTER TABLE events ADD COLUMN card_background_url TEXT`;
            results.push('Added card_background_url column');
        } else {
            results.push('card_background_url column already exists');
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
    path: "/api/add-card-appearance-columns"
};

