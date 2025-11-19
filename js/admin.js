// Admin Panel JavaScript
const ADMIN_PASSWORD = 'todak1q2w3e';
let tables = [];
let participants = [...attendanceData];

// Check if already logged in
if (localStorage.getItem('adminLoggedIn') === 'true') {
    showAdminContent();
}

// Load saved data
loadSavedData();

function handleLogin(event) {
    event.preventDefault();
    const password = document.getElementById('adminPassword').value;
    
    if (password === ADMIN_PASSWORD) {
        localStorage.setItem('adminLoggedIn', 'true');
        showAdminContent();
    } else {
        alert('Incorrect password!');
    }
}

function logout() {
    localStorage.removeItem('adminLoggedIn');
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('adminContent').style.display = 'none';
}

function showAdminContent() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    updateStats();
    renderParticipantsTable();
}

function updateStats() {
    const checkedIn = participants.filter(p => p.checkedIn).length;
    const vipCount = participants.filter(p => p.vip).length;
    const totalTablesCount = tables.length; // Use tables array length instead
    
    document.getElementById('totalParticipants').textContent = participants.length;
    document.getElementById('vipCount').textContent = vipCount;
    document.getElementById('checkedInCount').textContent = checkedIn;
    document.getElementById('totalTables').textContent = totalTablesCount;
}

function generateTables() {
    const numTables = parseInt(document.getElementById('numTables').value);
    const seatsPerTable = parseInt(document.getElementById('seatsPerTable').value);
    
    if (!numTables || numTables < 1) {
        alert('Please enter a valid number of tables');
        return;
    }
    
    tables = [];
    for (let i = 1; i <= numTables; i++) {
        tables.push({
            number: i,
            seats: seatsPerTable || 10,
            assigned: participants.filter(p => p.table === i)
        });
    }
    
    renderTables();
    renderParticipantsTable(); // Re-render participants table to show dropdowns
    updateStats(); // Update stats to show table count
    saveData();
}

function renderTables() {
    const container = document.getElementById('tablesContainer');
    container.innerHTML = '';
    
    tables.forEach(table => {
        const assignedParticipants = participants.filter(p => p.table === table.number);
        const tableCard = document.createElement('div');
        tableCard.className = 'table-card';
        tableCard.innerHTML = `
            <div class="table-header">
                <h3>Table ${table.number}</h3>
                <span class="table-capacity">${assignedParticipants.length} / ${table.seats}</span>
            </div>
            <div class="table-participants">
                ${assignedParticipants.map(p => `
                    <div class="participant-chip ${p.vip ? 'vip' : ''}">
                        ${p.name}
                        <button onclick="removeFromTable(${p.id})" class="remove-btn">×</button>
                    </div>
                `).join('') || '<p class="empty-table">No participants assigned</p>'}
            </div>
        `;
        container.appendChild(tableCard);
    });
}

function renderParticipantsTable() {
    const tbody = document.getElementById('participantsTableBody');
    const filteredParticipants = filterParticipantsList();
    
    tbody.innerHTML = filteredParticipants.map(p => `
        <tr class="${p.vip ? 'vip-row' : ''}">
            <td>${p.name}</td>
            <td>${p.company}</td>
            <td>${p.vip ? '<span class="badge-vip">VIP</span>' : '-'}</td>
            <td>
                <select onchange="assignTable(${p.id}, this.value)" ${!tables.length ? 'disabled' : ''}>
                    <option value="">Not Assigned</option>
                    ${tables.map(t => `
                        <option value="${t.number}" ${p.table === t.number ? 'selected' : ''}>
                            Table ${t.number}
                        </option>
                    `).join('')}
                </select>
            </td>
            <td>${p.checkedIn ? '<span class="badge-success">Yes</span>' : '<span class="badge-pending">No</span>'}</td>
            <td>
                <button onclick="viewParticipant(${p.id})" class="btn-small">View</button>
            </td>
        </tr>
    `).join('');
}

function filterParticipants() {
    renderParticipantsTable();
}

function filterParticipantsList() {
    const search = document.getElementById('searchParticipant').value.toLowerCase();
    const vipOnly = document.getElementById('filterVIP').checked;
    
    return participants.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search) || 
                            p.company.toLowerCase().includes(search);
        const matchesVIP = !vipOnly || p.vip;
        return matchesSearch && matchesVIP;
    });
}

function assignTable(participantId, tableNumber) {
    const participant = participants.find(p => p.id === participantId);
    if (participant) {
        participant.table = tableNumber ? parseInt(tableNumber) : null;
        saveData();
        renderTables();
        renderParticipantsTable(); // Re-render to update the dropdown selection
        updateStats();
    }
}

function removeFromTable(participantId) {
    assignTable(participantId, '');
}

function autoAssignTables() {
    if (!tables.length) {
        alert('Please generate tables first');
        return;
    }
    
    // Calculate total capacity
    const totalCapacity = tables.reduce((sum, table) => sum + table.seats, 0);
    const totalParticipants = participants.length;
    
    // Check if tables are sufficient
    if (totalCapacity < totalParticipants) {
        const shortage = totalParticipants - totalCapacity;
        alert(`⚠️ Warning: Not enough table capacity!\n\nTotal Participants: ${totalParticipants}\nTotal Capacity: ${totalCapacity}\nShortage: ${shortage} seats\n\nPlease add more tables or increase seats per table.`);
        return;
    }
    
    if (!confirm(`This will automatically assign all ${totalParticipants} participants to ${tables.length} tables.\n\nVIPs will be assigned first.\n\nContinue?`)) {
        return;
    }
    
    // Clear all assignments first
    participants.forEach(p => p.table = null);
    
    // Sort: VIPs first, then by name
    const sorted = [...participants].sort((a, b) => {
        if (a.vip && !b.vip) return -1;
        if (!a.vip && b.vip) return 1;
        return a.name.localeCompare(b.name);
    });
    
    let currentTable = 0;
    let seatsInCurrentTable = 0;
    
    sorted.forEach(participant => {
        if (seatsInCurrentTable >= tables[currentTable].seats) {
            currentTable++;
            seatsInCurrentTable = 0;
        }
        
        if (currentTable < tables.length) {
            const originalParticipant = participants.find(p => p.id === participant.id);
            originalParticipant.table = tables[currentTable].number;
            seatsInCurrentTable++;
        }
    });
    
    saveData();
    renderTables();
    renderParticipantsTable();
    updateStats();
    alert('✓ Table assignment completed successfully!');
}

function clearAllTables() {
    if (!confirm('Are you sure you want to clear all table assignments?')) {
        return;
    }
    
    participants.forEach(p => p.table = null);
    saveData();
    renderTables();
    renderParticipantsTable();
    updateStats();
}

function exportData() {
    const data = {
        participants: participants,
        tables: tables,
        exportedAt: new Date().toISOString(),
        version: Date.now()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `todak-event-config-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    alert(`✓ Configuration exported!\n\nNext steps:\n1. Transfer this file to check-in devices\n2. On check-in page, click "Import Config"\n3. Upload this file\n\nAll devices will then have the latest table assignments.`);
}

function generateQRCode() {
    // Open the QR page in a new window
    window.open('qr-checkin.html', '_blank');
}

function closeQRModal() {
    // No longer needed but kept for compatibility
}

function viewParticipant(id) {
    const participant = participants.find(p => p.id === id);
    if (participant) {
        alert(`Name: ${participant.name}\nCompany: ${participant.company}\nVIP: ${participant.vip ? 'Yes' : 'No'}\nTable: ${participant.table || 'Not Assigned'}\nChecked In: ${participant.checkedIn ? 'Yes' : 'No'}`);
    }
}

function addNewParticipant() {
    const name = prompt('Enter participant name:');
    if (!name || name.trim() === '') {
        return;
    }
    
    const company = prompt('Enter company/organization:') || 'N/A';
    const isVIP = confirm('Is this participant a VIP?');
    
    // Generate new ID
    const maxId = Math.max(...participants.map(p => p.id), 0);
    
    const newParticipant = {
        id: maxId + 1,
        name: name.trim(),
        company: company.trim(),
        vip: isVIP,
        table: null,
        checkedIn: false
    };
    
    participants.push(newParticipant);
    saveData();
    renderParticipantsTable();
    updateStats();
    
    alert(`✓ Participant "${name}" added successfully!`);
}

function saveData() {
    // Save to localStorage
    localStorage.setItem('participants', JSON.stringify(participants));
    localStorage.setItem('tables', JSON.stringify(tables));
    localStorage.setItem('lastSave', new Date().toISOString());
    
    console.log('💾 Data saved locally');
    showSyncStatus('Data saved ✓');
}

function showSyncStatus(message) {
    // Find or create status indicator
    let statusEl = document.getElementById('syncStatus');
    if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.id = 'syncStatus';
        statusEl.style.cssText = 'position: fixed; top: 80px; right: 20px; background: var(--success-color); color: white; padding: 10px 20px; border-radius: 8px; z-index: 1000; font-size: 0.9rem; opacity: 0; transition: opacity 0.3s;';
        document.body.appendChild(statusEl);
    }
    
    statusEl.textContent = message;
    statusEl.style.opacity = '1';
    
    setTimeout(() => {
        statusEl.style.opacity = '0';
    }, 3000);
}

function loadSavedData() {
    const savedParticipants = localStorage.getItem('participants');
    const savedTables = localStorage.getItem('tables');
    
    if (savedParticipants) {
        const parsed = JSON.parse(savedParticipants);
        // Merge with original data to ensure all participants are included
        participants = attendanceData.map(original => {
            const saved = parsed.find(p => p.id === original.id);
            return saved || original;
        });
    }
    
    if (savedTables) {
        tables = JSON.parse(savedTables);
        if (tables.length > 0) {
            renderTables();
        }
    }
}

