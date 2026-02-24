const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    try {
        const { 
            eventId, 
            name, 
            date, 
            time, 
            venue, 
            theme, 
            tentative, 
            menu, 
            features,
            cardIconUrl,
            cardBackgroundUrl,
            qrNoteTop,
            qrNoteBottom
        } = JSON.parse(event.body);

        // Normalize features to use snake_case
        if (features) {
            // Ensure we use snake_case keys
            if ('luckyDraw' in features) {
                features.lucky_draw = features.luckyDraw;
                delete features.luckyDraw;
            }
            // Set defaults if not specified
            if (!('attendance' in features)) {
                features.attendance = true;
            }
        }

        if (!eventId) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Event ID is required' 
                })
            };
        }

        // Connect to database
        const sql = neon(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL);

        // Parse time into start and end if provided as a range
        let timeStart = null;
        let timeEnd = null;
        if (time && time.includes(' - ')) {
            const [start, end] = time.split(' - ');
            timeStart = start.trim();
            timeEnd = end.trim();
        } else if (time) {
            timeStart = time;
        }

        // Update event details
        const result = await sql`
            UPDATE events
            SET 
                name = ${name},
                date = ${date},
                time_start = ${timeStart},
                time_end = ${timeEnd},
                venue = ${venue},
                theme = ${theme},
                tentative = ${tentative},
                menu = ${menu},
                features = ${JSON.stringify(features)},
                card_icon_url = ${cardIconUrl || null},
                card_background_url = ${cardBackgroundUrl || null},
                qr_note_top = ${qrNoteTop || null},
                qr_note_bottom = ${qrNoteBottom || null},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${eventId}
            RETURNING *
        `;

        if (result.length === 0) {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Event not found' 
                })
            };
        }

        // If tables feature is being disabled, optionally clear table assignments
        if (features && features.tables === false) {
            // Clear all table assignments for this event
            await sql`
                UPDATE participants
                SET table_number = NULL
                WHERE event_id = ${eventId}
            `;
            
            console.log(`Cleared table assignments for event ${eventId} as tables feature was disabled`);
        }

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({ 
                success: true,
                message: 'Event updated successfully',
                event: result[0]
            })
        };

    } catch (error) {
        console.error('Error updating event:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({ 
                success: false,
                message: 'Failed to update event',
                error: error.message 
            })
        };
    }
};