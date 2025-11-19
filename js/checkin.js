// Check-in JavaScript
let participants = [];
let selectedParticipant = null;

// Load data from localStorage
loadData();
updateStats();
updateConfigStatus();

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

function confirmCheckin() {
    if (!selectedParticipant) return;
    
    // Update check-in status
    selectedParticipant.checkedIn = true;
    saveData();
    
    // Show success message
    document.getElementById('tableAssignment').style.display = 'none';
    document.getElementById('checkinSuccess').style.display = 'block';
    
    updateStats();
    
    // Auto reset after 5 seconds
    setTimeout(() => {
        resetCheckin();
    }, 5000);
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

// Import configuration from admin
function importConfiguration(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validate data structure
            if (!Array.isArray(importedData) || importedData.length === 0) {
                alert('Invalid configuration file format');
                return;
            }
            
            // Save to localStorage
            localStorage.setItem('participants', JSON.stringify(importedData));
            localStorage.setItem('configImportTime', new Date().toISOString());
            
            // Reload data
            loadData();
            updateStats();
            updateConfigStatus();
            
            alert(`✓ Configuration imported successfully!\n${importedData.length} participants loaded.`);
        } catch (error) {
            alert('Error reading configuration file: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Show setup modal
function showSetupModal() {
    document.getElementById('setupModal').style.display = 'block';
    updateConfigStatus();
}

// Close setup modal
function closeSetupModal() {
    document.getElementById('setupModal').style.display = 'none';
}

// Update configuration status display
function updateConfigStatus() {
    const importTime = localStorage.getItem('configImportTime');
    const lastImportEl = document.getElementById('lastImport');
    const dataStatusEl = document.getElementById('dataStatus');
    
    if (!lastImportEl || !dataStatusEl) return; // Elements may not exist on other pages
    
    if (importTime) {
        const date = new Date(importTime);
        lastImportEl.textContent = date.toLocaleString();
        dataStatusEl.textContent = 'Synced with admin';
        dataStatusEl.style.color = 'var(--success-color)';
    } else {
        lastImportEl.textContent = 'Never';
        dataStatusEl.textContent = 'Using default data (no table assignments)';
        dataStatusEl.style.color = 'var(--danger-color)';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('setupModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

