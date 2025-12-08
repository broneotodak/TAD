// Shared utility to check if user is checked in
// Handles Safari localStorage blocking by falling back to database check

/**
 * Check if user is checked in for a specific event
 * Uses localStorage first, then falls back to database check for Safari compatibility
 * @param {string} eventId - The event ID
 * @returns {Promise<{isCheckedIn: boolean, participantId: number|null, participant: object|null}>}
 */
async function checkUserCheckedIn(eventId) {
    if (!eventId) {
        return { isCheckedIn: false, participantId: null, participant: null };
    }

    const sessionKey = `userCheckedInId_event_${eventId}`;
    let participantId = null;
    let localStorageAvailable = true;

    // Try to get from localStorage first
    try {
        participantId = localStorage.getItem(sessionKey);
        if (participantId) {
            participantId = parseInt(participantId);
        }
    } catch (error) {
        // Safari might block localStorage in private mode
        console.warn('localStorage not available (possibly Safari private mode):', error);
        localStorageAvailable = false;
    }

    // If we have a participant ID, verify it with the database
    if (participantId) {
        try {
            const response = await fetch(`/api/get-participants?eventId=${eventId}`);
            const result = await response.json();

            if (result.success && result.participants) {
                const participant = result.participants.find(p => p.id === participantId);
                
                if (participant && participant.checkedIn) {
                    return {
                        isCheckedIn: true,
                        participantId: participantId,
                        participant: participant
                    };
                } else {
                    // Participant not found or not checked in - clear invalid session
                    if (localStorageAvailable) {
                        try {
                            localStorage.removeItem(sessionKey);
                        } catch (e) {
                            // Ignore localStorage errors
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error verifying check-in status:', error);
            // If localStorage says checked in but database check fails, 
            // trust localStorage for now (network might be down)
            if (localStorageAvailable && participantId) {
                return {
                    isCheckedIn: true,
                    participantId: participantId,
                    participant: null // Can't verify, but assume checked in
                };
            }
        }
    }

    return { isCheckedIn: false, participantId: null, participant: null };
}

/**
 * Save check-in session (with Safari fallback)
 * @param {string} eventId - The event ID
 * @param {number} participantId - The participant ID
 */
function saveCheckInSession(eventId, participantId) {
    if (!eventId || !participantId) return;

    const sessionKey = `userCheckedInId_event_${eventId}`;
    
    try {
        localStorage.setItem(sessionKey, participantId.toString());
        console.log('✅ Check-in session saved to localStorage');
    } catch (error) {
        console.warn('Failed to save to localStorage (possibly Safari private mode):', error);
        // In Safari private mode, we'll rely on database check only
        // The checkUserCheckedIn function will still work via database verification
    }
}

/**
 * Clear check-in session
 * @param {string} eventId - The event ID
 */
function clearCheckInSession(eventId) {
    if (!eventId) return;

    const sessionKey = `userCheckedInId_event_${eventId}`;
    
    try {
        localStorage.removeItem(sessionKey);
    } catch (error) {
        // Ignore errors
    }
}
