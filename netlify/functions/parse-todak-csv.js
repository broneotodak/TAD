// Todak-specific CSV parser for participant data
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

        // 1. Preprocess content to handle multiline quotes
        const rawLines = fileContent.split(/\r?\n/);
        const lines = [];
        let currentLine = '';

        for (let line of rawLines) {
            if (!line.trim() && !currentLine) continue; // Skip empty lines if not building a line

            if (currentLine) {
                currentLine += '\n' + line;
            } else {
                currentLine = line;
            }

            // Count quotes to check if line is complete
            // A complete CSV line typically has an even number of quotes
            const quoteCount = (currentLine.match(/"/g) || []).length;
            if (quoteCount % 2 === 0) {
                lines.push(currentLine);
                currentLine = '';
            }
        }
        
        // If anything remains in currentLine (e.g. file ended with unclosed quote?), push it
        if (currentLine) {
            lines.push(currentLine);
        }

        if (lines.length < 2) {
            throw new Error('CSV file appears to be empty or invalid');
        }

        const participants = [];
        
        // Process each line
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Simple CSV parser that respects quotes
            // Regex to match: "quoted field" OR non-comma-sequence
            const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^",]*))/g;
            const parts = [];
            let match;
            while ((match = regex.exec(line)) !== null) {
                // match[1] is quoted content, match[2] is unquoted
                let val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
                parts.push(val);
            }
            // The regex might add an empty match at the end, filter if needed, or handle index carefully
            // Actually, for ",1,Comp,Name", matches:
            // 1. comma-empty -> parts[0] = undefined/empty
            // 2. ,1 -> parts[1] = 1
            
            // Let's stick to a simpler split if no quotes, but use regex if quotes found
            // Or just use the regex parts.
            // For ",1,THSB,Name", regex parts:
            // match 0: "" (empty before first comma)
            // match 1: "1"
            // match 2: "THSB"
            // match 3: "Name"
            
            // Note: regex.exec loop is tricky. 
            // Alternative simple split if complex regex fails or just use split for simple lines
            let csvParts = [];
            if (line.includes('"')) {
                // Complex parsing
                let inQuote = false;
                let currentPart = '';
                for (let j = 0; j < line.length; j++) {
                    const char = line[j];
                    if (char === '"') {
                        inQuote = !inQuote;
                    } else if (char === ',' && !inQuote) {
                        csvParts.push(currentPart);
                        currentPart = '';
                    } else {
                        currentPart += char;
                    }
                }
                csvParts.push(currentPart);
                
                // Clean up quotes
                csvParts = csvParts.map(p => p.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            } else {
                csvParts = line.split(',').map(p => p.trim());
            }

            // Skip header
            if (csvParts.some(p => p.toLowerCase() === 'name' || p.toLowerCase() === 'company')) continue;

            // FORMAT DETECTION
            let name = '';
            let company = '';
            let empNo = '';

            // Format 1: New format -> [, No, Company, Name]
            // csvParts[0] is empty or ID, csvParts[1] is No, csvParts[2] is Company, csvParts[3] is Name
            // Example: ["", "1", "THSB", "Khairul..."]
            if (csvParts.length >= 4 && /^\d+$/.test(csvParts[1])) {
                company = csvParts[2];
                name = csvParts[3];
                // If name is empty, maybe it's in column 4?
                if (!name && csvParts.length > 4) name = csvParts[4];
            } 
            // Format 2: Old format -> [EmpNo, Name, Company...] (heuristic)
            else if (csvParts[0] && csvParts[0].startsWith('TH0')) {
                empNo = csvParts[0];
                name = csvParts[1]; // Need more splitting logic if mixed
                // ... existing logic for mixed name/company ...
                // For simplicity in this rewrite, let's assume separated columns if comma present
                if (csvParts.length > 2) {
                    company = csvParts.slice(2).join(' ');
                }
            }
            // Format 3: Simple -> [No, Company, Name] (without leading comma)
            else if (csvParts.length >= 3 && /^\d+$/.test(csvParts[0])) {
                company = csvParts[1];
                name = csvParts[2];
            }
            // Format 4: [Team, Name]
            else if (csvParts.length === 2) {
                // Try to guess which is name
                name = csvParts[1];
                company = csvParts[0]; // Team name as company?
            } 
            else if (csvParts.length > 0) {
                // Fallback: last part is name?
                // Let's assume the longest part is name if unclear?
                // Safe fallback: skip ambiguous lines
                if (csvParts.length < 2) continue;
            }

            // Clean up
            if (name) name = name.replace(/\s+/g, ' ').trim();
            if (company) company = company.replace(/\s+/g, ' ').trim();

            // Validation
            if (!name || name.toLowerCase() === 'name') continue; // Skip header or empty

            participants.push({
                name: name,
                company: company || 'Not specified',
                vip: false, // No VIP column in this CSV, user can manual set or we can add logic later
                table: null
            });
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
        console.error('Error parsing Todak CSV:', error);
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
    path: "/api/parse-todak-csv"
};
