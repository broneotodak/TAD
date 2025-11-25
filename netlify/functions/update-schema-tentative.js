// Add tentative and menu fields to events table
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
    try {
        const sql = neon(process.env.NETLIFY_DATABASE_URL);

        console.log('Adding tentative and menu columns to events table...');

        // Add tentative column
        try {
            await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS tentative TEXT`;
            console.log('✓ Added tentative column');
        } catch (e) {
            console.log('✓ tentative column already exists');
        }

        // Add menu column
        try {
            await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS menu TEXT`;
            console.log('✓ Added menu column');
        } catch (e) {
            console.log('✓ menu column already exists');
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Schema updated successfully - added tentative and menu columns'
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
    path: "/api/update-schema-tentative"
};
