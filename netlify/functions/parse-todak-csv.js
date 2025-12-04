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
        
        // Check if first row contains headers (header-based format)
        let hasHeaders = false;
        let nameIndex = -1;
        let companyIndex = -1;
        let vipIndex = -1;
        let tableIndex = -1;
        
        if (rows.length > 0) {
            const firstRow = rows[0].map(c => c.toLowerCase().trim());
            // Check if this looks like a header row
            if (firstRow.some(c => c.includes('name') || c.includes('nama') || c.includes('full name'))) {
                hasHeaders = true;
                // Find column indices
                // For name, find the FIRST occurrence (in case of duplicate headers)
                nameIndex = firstRow.findIndex(h => h.includes('name') || h.includes('nama') || h.includes('full name'));
                companyIndex = firstRow.findIndex(h => h.includes('company') || h.includes('organization') || h.includes('syarikat'));
                vipIndex = firstRow.findIndex(h => (h.includes('vip') || h.includes('status')) && h !== 'full name');
                tableIndex = firstRow.findIndex(h => h.includes('table') || h.includes('meja'));
                
                // If VIP column not found by header, try to detect it by content
                // Look for a column that contains TRUE/FALSE values (common VIP indicators)
                if (vipIndex === -1 && rows.length > 1) {
                    // Check each column (skip Number, Company, Name columns)
                    for (let colIdx = 0; colIdx < firstRow.length; colIdx++) {
                        // Skip if this is the name or company column
                        if (colIdx === nameIndex || colIdx === companyIndex) continue;
                        
                        // Check if this column contains TRUE/FALSE/empty values in data rows
                        let vipLikeCount = 0;
                        let sampleRows = Math.min(20, rows.length - 1); // Check first 20 data rows
                        for (let rowIdx = 1; rowIdx <= sampleRows && rowIdx < rows.length; rowIdx++) {
                            if (rowIdx >= rows.length) break;
                            const cellValue = (rows[rowIdx][colIdx] || '').toString().trim().toUpperCase();
                            // Check for VIP-like values: TRUE, FALSE, 1, 0, or empty (which indicates boolean column)
                            if (cellValue === 'TRUE' || cellValue === 'FALSE' || 
                                cellValue === '1' || cellValue === '0' || 
                                cellValue === '' || cellValue === 'YES' || cellValue === 'NO') {
                                vipLikeCount++;
                            }
                        }
                        
                        // If most cells in this column are VIP-like values, it's likely the VIP column
                        // Require at least 50% match to avoid false positives
                        if (sampleRows > 0 && vipLikeCount >= sampleRows * 0.5) {
                            vipIndex = colIdx;
                            console.log(`VIP column auto-detected at index ${colIdx} (header: "${firstRow[colIdx]}") based on TRUE/FALSE/empty values (${vipLikeCount}/${sampleRows} matches)`);
                            break;
                        }
                    }
                }
                
                console.log('CSV Header detection:', {
                    nameIndex,
                    companyIndex,
                    vipIndex,
                    tableIndex,
                    headers: firstRow
                });
                
                if (nameIndex === -1) {
                    hasHeaders = false; // Invalid header format, fall back to old format
                }
            }
        }
        
        // Start from row 1 if headers detected, otherwise start from row 0
        const startRow = hasHeaders ? 1 : 0;
        
        for (let i = startRow; i < rows.length; i++) {
            const row = rows[i];
            // Skip empty rows
            if (row.length === 0 || (row.length === 1 && !row[0])) continue;

            let name = '';
            let company = '';
            let vip = false;
            let table = null;

            if (hasHeaders) {
                // Header-based format: Name, Company, VIP, Table
                if (nameIndex >= 0 && nameIndex < row.length) {
                    name = row[nameIndex];
                }
                if (companyIndex >= 0 && companyIndex < row.length) {
                    company = row[companyIndex] || '';
                }
                // Parse VIP status
                // Accepted VIP values (case-insensitive): true, 1, yes, y, vip, vvip
                // Non-VIP values: false, 0, no, n, or blank/empty
                if (vipIndex >= 0 && vipIndex < row.length) {
                    const rawVipValue = row[vipIndex] || '';
                    const vipValue = rawVipValue.toString().trim().toLowerCase();
                    
                    // Check for VIP indicators (case-insensitive)
                    if (vipValue === 'true' || 
                        vipValue === '1' || 
                        vipValue === 'yes' || 
                        vipValue === 'vip' || 
                        vipValue === 'vvip' ||
                        vipValue === 'y') {
                        vip = true;
                    } else {
                        // Empty, false, 0, no, n, or any other value → false
                        vip = false;
                        if (vipValue && vipValue !== 'false' && vipValue !== '0' && vipValue !== 'no' && vipValue !== 'n') {
                            // Log unknown values for debugging
                            console.log(`Row ${i}: Unknown VIP value "${rawVipValue}", defaulting to false`);
                        }
                    }
                } else if (vipIndex >= 0) {
                    // VIP column exists but this row doesn't have enough columns
                    console.log(`Row ${i}: Missing VIP column (has ${row.length} columns, need ${vipIndex + 1})`);
                    vip = false;
                }
                if (tableIndex >= 0 && tableIndex < row.length && row[tableIndex]) {
                    const tableNum = parseInt(row[tableIndex]);
                    if (!isNaN(tableNum)) {
                        table = tableNum;
                    }
                }
            } else {
                // Old format: No, Company, Name or , No, Company, Name
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
                // Skip header-like rows
                else if (row.some(c => c.toLowerCase() === 'name' || c.toLowerCase() === 'company')) {
                    continue;
                }
                // Skip unknown formats
                else if (row.length >= 2) {
                    continue;
                }
            }

            // Clean up
            if (name) name = name.replace(/\s+/g, ' ').trim();
            if (company) company = company.replace(/\s+/g, ' ').trim();

            if (name && name.toLowerCase() !== 'name') {
                participants.push({
                    name: name,
                    company: company || 'Not specified',
                    vip: vip,
                    table: table
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
