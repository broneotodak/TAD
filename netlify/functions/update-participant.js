// Update a single participant
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { id, name, company, vip, table, checked_in } = await req.json();
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    if (!id || !name) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'ID and name are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let result;
    
    // Handle checked_in update separately if provided
    if (checked_in !== undefined) {
      if (checked_in === true) {
        // If checking in, set both checked_in and timestamp
        result = await sql`
          UPDATE participants 
          SET 
            name = ${name},
            company = ${company || ''},
            vip = ${vip === true},
            table_number = ${table || null},
            checked_in = true,
            checked_in_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id}
          RETURNING *
        `;
      } else {
        // If unchecking, only update checked_in (preserve original check-in time)
        result = await sql`
          UPDATE participants 
          SET 
            name = ${name},
            company = ${company || ''},
            vip = ${vip === true},
            table_number = ${table || null},
            checked_in = false,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id}
          RETURNING *
        `;
      }
    } else {
      // Normal update without touching check-in status
      result = await sql`
        UPDATE participants 
        SET 
          name = ${name},
          company = ${company || ''},
          vip = ${vip === true},
          table_number = ${table || null},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    }

    if (result.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Participant not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      participant: result[0]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating participant:', error);
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
  path: "/api/update-participant"
};

