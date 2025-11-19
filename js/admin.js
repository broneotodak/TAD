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
    
    if (!confirm('This will automatically assign all unassigned participants to tables. Continue?')) {
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
            participant.table = tables[currentTable].number;
            seatsInCurrentTable++;
        }
    });
    
    saveData();
    renderTables();
    renderParticipantsTable();
    updateStats();
    alert('Table assignment completed!');
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
    const dataStr = JSON.stringify(participants, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `todak-dinner-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
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

function saveData() {
    localStorage.setItem('participants', JSON.stringify(participants));
    localStorage.setItem('tables', JSON.stringify(tables));
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

