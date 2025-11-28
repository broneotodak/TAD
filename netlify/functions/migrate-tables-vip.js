// Migration: Add is_vip column to tables_config
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
    try {
        const sql = neon(process.env.NETLIFY_DATABASE_URL);

        // Check if column already exists
        const checkColumn = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'tables_config' 
            AND column_name = 'is_vip'
        `;

        if (checkColumn.length === 0) {
            await sql`ALTER TABLE tables_config ADD COLUMN is_vip BOOLEAN DEFAULT FALSE`;
            return new Response(JSON.stringify({
                success: true,
                message: 'Added is_vip column to tables_config'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            return new Response(JSON.stringify({
                success: true,
                message: 'is_vip column already exists'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

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
    path: "/api/migrate-tables-vip"
};

