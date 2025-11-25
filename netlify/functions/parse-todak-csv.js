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

        // Parse CSV content
        const lines = fileContent.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('CSV file appears to be empty');
        }

        const participants = [];
        
        // Known company names mapping
        const companyMap = {
            'Holdings': 'Todak Holdings Sdn Bhd',
            'Academy': 'Todak Academy Sdn Bhd',
            'Studios': 'Todak Studios Sdn Bhd',
            'Culture': 'Todak Culture Sdn Bhd',
            'Digitech': 'Todak Digitech Sdn Bhd',
            'Paygate': 'Todak Paygate Sdn Bhd',
            'Tech': 'MyBarber Tech Sdn Bhd',
            'Technology': 'Sarcom Technology Sdn Bhd',
            'Esports Ventures': 'CG Esports Ventures',
            'Enterprise': '10 Camp Enterprise',
            'Hub': 'Muscle Hub',
            'Enterprise': 'Todakrc Enterprise',
            'Elektronik Todak': 'Kelab Sukan Elektronik Todak',
            'Consultation & Management': 'Lan Todak Consultation & Management',
            'Tadika Todak Kids': 'Tadika Todak Kids',
            'Todak Fusion Sdn Bhd': 'Todak Fusion Sdn Bhd'
        };

        // Process each line
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Split by comma
            const parts = line.split(',').map(p => p.trim());
            if (parts.length < 2) continue;

            const empNo = parts[0];
            
            // Handle the special format where name and company are mixed
            // Format: "Name Todak,Company Suffix" or "Name Company,Suffix"
            let name = '';
            let company = '';
            
            if (parts.length === 3) {
                // Format like: "TH006,Khairul Azlan Bin Zainal Ariffin Todak,Holdings Sdn Bhd"
                const namePart = parts[1];
                const companySuffix = parts[2];
                
                // Find where the company name starts
                // Company usually starts with known prefixes
                const companyPrefixes = ['Todak', 'Mybarber', 'Sarcom', 'CG', 'Muscle', 'Tadika', 
                                        'Lan Todak', 'Kelab', '10 Camp'];
                
                let foundPrefix = '';
                let nameEnd = namePart.length;
                
                for (const prefix of companyPrefixes) {
                    const idx = namePart.lastIndexOf(' ' + prefix);
                    if (idx > 0) {
                        nameEnd = idx;
                        foundPrefix = namePart.substring(idx + 1);
                        break;
                    }
                }
                
                name = namePart.substring(0, nameEnd).trim();
                
                // Build full company name
                if (foundPrefix && companySuffix) {
                    // Check if we have a known mapping
                    if (companyMap[companySuffix]) {
                        company = companyMap[companySuffix];
                    } else {
                        company = `${foundPrefix} ${companySuffix}`;
                    }
                } else if (companySuffix) {
                    company = companySuffix;
                } else {
                    company = foundPrefix;
                }
            } else if (parts.length === 2) {
                // Simple format: "Employee No,Name"
                name = parts[1];
                company = '';
            } else {
                // Format with all parts separated
                name = parts[1];
                company = parts.slice(2).join(' ');
            }
            
            // Clean up common issues
            name = name.replace(/\s+/g, ' ').trim();
            company = company.replace(/\s+/g, ' ').trim();
            
            // Skip if no name
            if (!name || name === '') continue;
            
            // Detect VIP status (you can customize this logic)
            const isVIP = empNo.startsWith('TH0') && parseInt(empNo.substring(2)) <= 10;
            
            participants.push({
                name: name,
                company: company || 'Not specified',
                vip: isVIP,
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
