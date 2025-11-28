// Todak-specific CSV parser for participant data (Robust Manual Parser)
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

        // --- Robust Manual CSV Parsing ---
        // This avoids regex complexity and timeouts
        const rows = [];
        let currentRow = [];
        let currentField = '';
        let inQuote = false;
        
        // Iterate character by character
        for (let i = 0; i < fileContent.length; i++) {
            const char = fileContent[i];
            const nextChar = fileContent[i + 1];

            if (inQuote) {
                if (char === '"') {
                    if (nextChar === '"') {
                        // Escaped quote ("") inside quote
                        currentField += '"';
                        i++; // Skip next quote
                    } else {
                        // End of quote
                        inQuote = false;
                    }
                } else {
                    currentField += char;
                }
            } else {
                if (char === '"') {
                    inQuote = true;
                } else if (char === ',') {
                    // End of field
                    currentRow.push(currentField.trim());
                    currentField = '';
                } else if (char === '\n' || char === '\r') {
                    // End of row
                    if (char === '\r' && nextChar === '\n') i++; // Handle CRLF
                    
                    currentRow.push(currentField.trim());
                    if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) {
                        rows.push(currentRow);
                    }
                    currentRow = [];
                    currentField = '';
                } else {
                    currentField += char;
                }
            }
        }
        // Push last row if exists
        if (currentField || currentRow.length > 0) {
            currentRow.push(currentField.trim());
            if (currentRow.length > 0) rows.push(currentRow);
        }

        // --- Extract Participants ---
        const participants = [];
        
        for (const row of rows) {
            // Skip empty rows
            if (row.length === 0 || (row.length === 1 && !row[0])) continue;

            let name = '';
            let company = '';

            // Format: [, No, Company, Name] (Leading comma results in empty first element)
            if (row.length >= 4 && row[0] === '' && /^\d+$/.test(row[1])) {
                company = row[2];
                name = row[3];
            }
            // Format: [No, Company, Name] (Simple)
            else if (row.length >= 3 && /^\d+$/.test(row[0])) {
                company = row[1];
                name = row[2];
            }
            // Fallback: Check for Name/Company headers to skip
            else if (row.some(c => c.toLowerCase() === 'name' || c.toLowerCase() === 'company')) {
                continue;
            }
            // Fallback: Look for text fields
            else if (row.length >= 2) {
                // Heuristic: Name is usually longest or last text field?
                // Safe default: Skip unknown formats to avoid junk
                continue;
            }

            // Clean up
            if (name) name = name.replace(/\s+/g, ' ').trim();
            if (company) company = company.replace(/\s+/g, ' ').trim();

            if (name && name.toLowerCase() !== 'name') {
                participants.push({
                    name: name,
                    company: company || 'Not specified',
                    vip: false,
                    table: null
                });
            }
        }

        return new Response(JSON.stringify({
            success: true,
            participants: participants,
            count: participants.length,
            message: `Successfully extracted ${participants.length} participants`
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error parsing CSV:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Server Error: ' + error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const config = {
    path: "/api/parse-todak-csv"
};
