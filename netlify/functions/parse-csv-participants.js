// Simple CSV parser for participant data (no AI required)
export default async (req, context) => {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const { eventId, fileContent, fileName } = await req.json();

        if (!fileContent) {
            return new Response(JSON.stringify({
                success: false,
                error: 'File content is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Parse CSV content
        const lines = fileContent.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('CSV file appears to be empty');
        }

        // Get headers (first line)
        const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
        
        // Find column indices
        const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('nama'));
        const companyIndex = headers.findIndex(h => h.includes('company') || h.includes('organization') || h.includes('syarikat'));
        const vipIndex = headers.findIndex(h => h.includes('vip') || h.includes('status'));
        const tableIndex = headers.findIndex(h => h.includes('table') || h.includes('meja'));

        if (nameIndex === -1) {
            throw new Error('Could not find name column in CSV');
        }

        // Parse data rows
        const participants = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Simple CSV parsing (handles basic comma separation)
            const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
            
            // Special handling for your format where name and company are in same column
            // Format: "Name Company,Sdn Bhd" should become Name and "Company Sdn Bhd"
            if (nameIndex === 1 && values.length >= 3) {
                // The name is in column 2, but it includes part of company name
                const fullName = values[1]; // e.g., "Khairul Azlan Bin Zainal Ariffin Todak"
                const companySuffix = values[2]; // e.g., "Holdings Sdn Bhd"
                
                // Split name from company (company usually starts with capital letter after personal name)
                // Look for common company prefixes
                const companyPrefixes = ['Todak', 'Holdings', 'Academy', 'Studios', 'Culture', 'Digitech', 
                                        'Mybarber', 'Paygate', 'Sarcom', 'CG', 'Muscle', 'Tadika', 
                                        'Lan', 'Kelab', '10 Camp'];
                
                let actualName = fullName;
                let companyPrefix = '';
                
                for (const prefix of companyPrefixes) {
                    const idx = fullName.lastIndexOf(' ' + prefix);
                    if (idx > 0) {
                        actualName = fullName.substring(0, idx).trim();
                        companyPrefix = fullName.substring(idx + 1).trim();
                        break;
                    }
                }
                
                // Build full company name
                const fullCompany = companyPrefix && companySuffix ? 
                    `${companyPrefix} ${companySuffix}` : 
                    companySuffix || companyPrefix || '';
                
                const participant = {
                    name: actualName,
                    company: fullCompany,
                    vip: false,
                    table: null
                };
                
                participants.push(participant);
                continue;
            }
            
            // Standard parsing for other formats
            const name = values[nameIndex];
            if (!name) continue;

            const participant = {
                name: name,
                company: companyIndex >= 0 ? values[companyIndex] || '' : '',
                vip: false,
                table: null
            };

            // Check VIP status
            if (vipIndex >= 0) {
                const vipValue = values[vipIndex]?.toLowerCase();
                participant.vip = vipValue === 'true' || vipValue === '1' || vipValue === 'yes' || vipValue === 'vip' || vipValue === 'vvip';
            }

            // Check table number
            if (tableIndex >= 0 && values[tableIndex]) {
                const tableNum = parseInt(values[tableIndex]);
                if (!isNaN(tableNum)) {
                    participant.table = tableNum;
                }
            }

            participants.push(participant);
        }

        return new Response(JSON.stringify({
            success: true,
            participants: participants,
            count: participants.length,
            message: `Successfully extracted ${participants.length} participants from CSV`
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error parsing CSV:', error);
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
    path: "/api/parse-csv-participants"
};
