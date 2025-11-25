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

            // Split by comma - be careful with commas in names
            const parts = line.split(',').map(p => p.trim());
            if (parts.length < 2) continue;

            const empNo = parts[0];
            
            // Handle the special format where name and company are mixed
            let name = '';
            let company = '';
            
            if (parts.length >= 3) {
                // Format like: "TH006,Khairul Azlan Bin Zainal Ariffin Todak,Holdings Sdn Bhd"
                // Or special teams like: "MLBB,(MAL) Name Kelab,Sukan Elektronik Todak"
                const namePart = parts[1];
                const companySuffix = parts.slice(2).join(' '); // Join all remaining parts
                
                // Check for special prefixes in names (like team designations)
                const specialPrefixes = ['(MAL)', '(Ladies)'];
                let hasSpecialPrefix = false;
                for (const prefix of specialPrefixes) {
                    if (namePart.includes(prefix)) {
                        hasSpecialPrefix = true;
                        break;
                    }
                }
                
                if (hasSpecialPrefix) {
                    // For special cases, the whole namePart is the name
                    name = namePart;
                    company = companySuffix;
                } else {
                    // Find where the company name starts
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
                        company = `${foundPrefix} ${companySuffix}`;
                    } else if (companySuffix) {
                        company = companySuffix;
                    } else {
                        company = foundPrefix;
                    }
                }
            } else if (parts.length === 2) {
                // Simple format: "Employee No,Name" or "TeamName,PlayerName Company"
                const secondPart = parts[1];
                
                // Check if this is a team/player entry
                const teamPrefixes = ['Valorant', 'MLBB', 'Freefire', 'PUBGM', 'HOK', 'EFOOTBALL'];
                if (teamPrefixes.includes(empNo)) {
                    // This is a team entry - extract name and company
                    const lastSpaceIdx = secondPart.lastIndexOf(' ');
                    if (lastSpaceIdx > 0) {
                        // Check if last word looks like a company
                        const lastWord = secondPart.substring(lastSpaceIdx + 1);
                        if (lastWord === 'Kelab' || lastWord === 'Todak' || lastWord.includes('Sdn')) {
                            // Find where company starts (usually "Kelab Sukan Elektronik Todak")
                            const companyStartWords = ['Kelab', 'Todak'];
                            let companyStart = -1;
                            for (const word of companyStartWords) {
                                const idx = secondPart.indexOf(' ' + word);
                                if (idx > 0) {
                                    companyStart = idx + 1;
                                    break;
                                }
                            }
                            
                            if (companyStart > 0) {
                                name = secondPart.substring(0, companyStart - 1).trim();
                                company = secondPart.substring(companyStart).trim();
                            } else {
                                name = secondPart;
                                company = empNo; // Use team name as company
                            }
                        } else {
                            name = secondPart;
                            company = empNo; // Use team name as company
                        }
                    } else {
                        name = secondPart;
                        company = empNo; // Use team name as company
                    }
                } else if (empNo === '') {
                    // Empty employee number - might be Todak Fusion entries
                    name = secondPart;
                    company = 'Todak Fusion Sdn Bhd';
                } else {
                    // Regular format
                    name = secondPart;
                    company = '';
                }
            } else {
                // Format with all parts separated
                name = parts[1];
                company = parts.slice(2).join(' ');
            }
            
            // Clean up common issues
            name = name.replace(/\s+/g, ' ').trim();
            company = company.replace(/\s+/g, ' ').trim();
            
            // Skip if no name or if it's just a number
            if (!name || name === '' || /^\d+$/.test(name)) continue;
            
            // Clean up company names
            if (company.includes('Sukan Elektronik Todak')) {
                company = 'Kelab Sukan Elektronik Todak';
            }
            
            // Detect VIP status (customize as needed)
            const isVIP = empNo && empNo.startsWith('TH0') && parseInt(empNo.substring(2)) <= 10;
            
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
