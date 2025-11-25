// AI-powered participant extraction using OpenAI
import { neon } from '@neondatabase/serverless';

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

        // Call OpenAI API to extract participant data
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are a data extraction assistant. Extract participant information from the provided text and return it as a JSON array. Each participant should have: name (string), company (string), vip (boolean - true if marked as VIP/VVIP/special guest), table (number or null). Be intelligent about detecting VIP status from titles, positions, or explicit VIP markers. If table number is not specified, set it to null. Return ONLY valid JSON array, no additional text.`
                    },
                    {
                        role: 'user',
                        content: `Extract participant data from this ${fileName || 'document'}:\n\n${fileContent}`
                    }
                ],
                temperature: 0.3,
                max_tokens: 4000
            })
        });

        if (!openaiResponse.ok) {
            const error = await openaiResponse.json();
            throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
        }

        const aiResult = await openaiResponse.json();
        const extractedText = aiResult.choices[0].message.content.trim();

        // Parse the JSON response
        let participants;
        try {
            // Remove markdown code blocks if present
            const jsonText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            participants = JSON.parse(jsonText);
        } catch (parseError) {
            throw new Error('Failed to parse AI response as JSON');
        }

        // Validate the extracted data
        if (!Array.isArray(participants)) {
            throw new Error('AI response is not an array');
        }

        // Clean and validate each participant
        const validatedParticipants = participants.map((p, index) => ({
            name: p.name?.trim() || `Participant ${index + 1}`,
            company: p.company?.trim() || '',
            vip: Boolean(p.vip),
            table: p.table ? parseInt(p.table) : null
        }));

        return new Response(JSON.stringify({
            success: true,
            participants: validatedParticipants,
            count: validatedParticipants.length,
            message: `Successfully extracted ${validatedParticipants.length} participants`
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error in AI extraction:', error);
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
    path: "/api/upload-participants-ai"
};
