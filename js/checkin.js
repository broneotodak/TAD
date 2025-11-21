// Check-in JavaScript
let participants = [];
let selectedParticipant = null;

// Check if user already checked in (restore session)
function checkExistingSession() {
    const sessionId = localStorage.getItem('userCheckedInId');
    if (sessionId) {
        console.log('Found existing check-in session:', sessionId);
        return parseInt(sessionId);
    }
    return null;
}

// Load data from database
if (window.dbAPI) {
    window.dbAPI.getParticipants().then(result => {
        if (result.success && result.data) {
            participants = result.data.participants;
            console.log(`✅ Loaded ${participants.length} participants from database`);
            
            // Check for existing session
            const sessionId = checkExistingSession();
            if (sessionId) {
                const participant = participants.find(p => p.id === sessionId);
                if (participant && participant.checkedIn) {
                    console.log('Restoring session for:', participant.name);
                    showCheckedInView(participant);
                    return;
                } else {
                    // Session invalid, clear it
                    localStorage.removeItem('userCheckedInId');
                }
            }
        } else {
            participants = [...attendanceData];
            console.log('⚠️ Using default data');
        }
        updateStats();
        updateConfigStatus();
    }).catch(error => {
        console.error('Failed to load data:', error);
        participants = [...attendanceData];
        updateStats();
        updateConfigStatus();
    });
} else {
    loadData();
    updateStats();
    updateConfigStatus();
}

// Show persistent checked-in view
async function showCheckedInView(participant) {
    selectedParticipant = participant;
    
    // Hide ALL other sections
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('participantSearch').style.display = 'none';
    document.querySelector('.checkin-header').style.display = 'none';
    document.getElementById('tableAssignment').style.display = 'none'; // Hide preview screen
    
    // Show ONLY checked-in success view
    const successSection = document.getElementById('checkinSuccess');
    successSection.style.display = 'block';
    
    // Update final display
    document.getElementById('finalTableNumber').textContent = participant.table || 'Not Assigned';
    
    // Show tablemates
    const finalTablematesList = document.getElementById('finalTablematesList');
    if (!participant.table) {
        finalTablematesList.innerHTML = '<p class="no-tablemates">No table assigned yet</p>';
    } else {
        const tablemates = participants.filter(p => 
            p.table === participant.table && p.id !== participant.id
        );
        
        if (tablemates.length === 0) {
            finalTablematesList.innerHTML = '<p class="no-tablemates">You are the first one at this table!</p>';
        } else {
            finalTablematesList.innerHTML = tablemates.map(p => `
                <div class="tablemate-item ${p.vip ? 'vip' : ''}">
                    <span>${p.name}</span>
                    ${p.vip ? '<span class="badge-vip-small">VIP</span>' : ''}
                    ${p.checkedIn ? '<span class="badge-checked-small">✓</span>' : ''}
                </div>
            `).join('');
        }
    }
    
    // Load and display event information
    await loadAndDisplayEventInfo();
}

// Load event information from database
async function loadAndDisplayEventInfo() {
    try {
        const response = await fetch('/api/get-event-info');
        const result = await response.json();
        
        if (result.success && result.data) {
            const info = result.data;
            
            // Display schedule if available
            if (info.schedule && info.schedule.trim()) {
                document.getElementById('eventScheduleSection').style.display = 'block';
                document.getElementById('eventScheduleContent').textContent = info.schedule;
            }
            
            // Display menu if available
            if (info.menu && info.menu.trim()) {
                document.getElementById('eventMenuSection').style.display = 'block';
                document.getElementById('eventMenuContent').textContent = info.menu;
            }
            
            // Display announcements if available
            if (info.announcements && info.announcements.trim()) {
                document.getElementById('eventAnnouncementsSection').style.display = 'block';
                document.getElementById('eventAnnouncementsContent').textContent = info.announcements;
            }
            
            console.log('✅ Event info displayed');
        }
    } catch (error) {
        console.error('Failed to load event info:', error);
    }
}

function loadData() {
    const savedParticipants = localStorage.getItem('participants');
    if (savedParticipants) {
        participants = JSON.parse(savedParticipants);
    } else {
        participants = [...attendanceData];
    }
}

function saveData() {
    localStorage.setItem('participants', JSON.stringify(participants));
}

function updateStats() {
    const checkedIn = participants.filter(p => p.checkedIn).length;
    document.getElementById('totalGuests').textContent = participants.length;
    document.getElementById('checkedInGuests').textContent = checkedIn;
}

function searchParticipants() {
    const searchTerm = document.getElementById('participantSearch').value.toLowerCase();
    const resultsContainer = document.getElementById('searchResults');
    
    if (searchTerm.length < 2) {
        resultsContainer.innerHTML = '<p class="search-hint">Type at least 2 characters to search...</p>';
        return;
    }
    
    const filtered = participants.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || 
        p.company.toLowerCase().includes(searchTerm)
    );
    
    if (filtered.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">No participants found</p>';
        return;
    }
    
    resultsContainer.innerHTML = filtered.map(p => `
        <div class="result-item ${p.vip ? 'vip' : ''} ${p.checkedIn ? 'checked-in' : ''}" 
             onclick="selectParticipant(${p.id})">
            <div class="result-info">
                <div class="result-name">
                    ${p.name}
                    ${p.vip ? '<span class="badge-vip-small">VIP</span>' : ''}
                    ${p.checkedIn ? '<span class="badge-checked">✓ Checked In</span>' : ''}
                </div>
                <div class="result-company">${p.company}</div>
            </div>
            <div class="result-table">
                ${p.table ? `Table ${p.table}` : 'No table assigned'}
            </div>
        </div>
    `).join('');
}

function selectParticipant(id) {
    selectedParticipant = participants.find(p => p.id === id);
    
    if (!selectedParticipant) return;
    
    if (selectedParticipant.checkedIn) {
        if (!confirm(`${selectedParticipant.name} has already checked in. Check in again?`)) {
            return;
        }
    }
    
    // Hide search results and show table assignment
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('participantSearch').style.display = 'none';
    document.querySelector('.checkin-header').style.display = 'none';
    
    const assignmentSection = document.getElementById('tableAssignment');
    assignmentSection.style.display = 'block';
    
    document.getElementById('participantName').textContent = selectedParticipant.name;
    document.getElementById('tableNumber').textContent = selectedParticipant.table || 'Not Assigned';
    
    // Show tablemates
    showTablemates();
}

function showTablemates() {
    const tablematesList = document.getElementById('tablematesList');
    
    if (!selectedParticipant.table) {
        tablematesList.innerHTML = '<p class="no-tablemates">No table assigned yet</p>';
        return;
    }
    
    const tablemates = participants.filter(p => 
        p.table === selectedParticipant.table && p.id !== selectedParticipant.id
    );
    
    if (tablemates.length === 0) {
        tablematesList.innerHTML = '<p class="no-tablemates">You are the first one at this table!</p>';
        return;
    }
    
    tablematesList.innerHTML = tablemates.map(p => `
        <div class="tablemate-item ${p.vip ? 'vip' : ''}">
            <span>${p.name}</span>
            ${p.vip ? '<span class="badge-vip-small">VIP</span>' : ''}
            ${p.checkedIn ? '<span class="badge-checked-small">✓</span>' : ''}
        </div>
    `).join('');
}

async function confirmCheckin() {
    if (!selectedParticipant) return;
    
    console.log('Confirming check-in for:', selectedParticipant.name);
    
    // Update check-in status locally
    selectedParticipant.checkedIn = true;
    selectedParticipant.checkedInAt = new Date().toISOString();
    
    // Save to database
    if (window.dbAPI) {
        const result = await window.dbAPI.checkinParticipant(selectedParticipant.id);
        if (result.success) {
            console.log('✅ Check-in saved to database');
        }
    }
    
    // Save user session to remember they checked in
    localStorage.setItem('userCheckedInId', selectedParticipant.id.toString());
    console.log('Session saved for user:', selectedParticipant.id);
    
    // Save locally as backup
    saveData();
    updateStats();
    
    // Show the persistent checked-in view
    showCheckedInView(selectedParticipant);
}

function resetCheckin() {
    selectedParticipant = null;
    
    // Reset displays
    document.getElementById('tableAssignment').style.display = 'none';
    document.getElementById('checkinSuccess').style.display = 'none';
    document.getElementById('searchResults').style.display = 'block';
    document.getElementById('participantSearch').style.display = 'block';
    document.querySelector('.checkin-header').style.display = 'block';
    
    // Clear search
    document.getElementById('participantSearch').value = '';
    document.getElementById('searchResults').innerHTML = '';
    
    // Reload data to get latest updates
    loadData();
    updateStats();
    
    // Focus on search input
    document.getElementById('participantSearch').focus();
}

// Config status (no longer needed with database, but keep for compatibility)
function updateConfigStatus() {
    // No-op - using database now
}

// Clear user session and return to search
function clearUserSession() {
    console.log('Clearing user session');
    localStorage.removeItem('userCheckedInId');
    
    // Reload page to show search interface
    window.location.reload();
}

