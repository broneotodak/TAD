// One-time function to add the 2 missing VIPs
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    const missingVips = [
      { id: 3, name: "Bushinta", company: "PT TODAK", vip: true },
      { id: 15, name: "Muhammad Zaid Ariffuddin Bin Zainal Ariffin", company: "10CAMP", vip: true }
    ];
    
    let added = 0;
    
    for (const p of missingVips) {
      await sql`
        INSERT INTO participants (id, name, company, vip, table_number, checked_in)
        VALUES (${p.id}, ${p.name}, ${p.company}, ${p.vip}, NULL, FALSE)
        ON CONFLICT (id) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          company = EXCLUDED.company,
          vip = EXCLUDED.vip
      `;
      added++;
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Missing VIPs added successfully',
      added: added,
      vips: missingVips
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error adding VIPs:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

export const config = {
  path: "/api/add-missing-vips"
};

