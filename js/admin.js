// Admin Panel JavaScript
const ADMIN_PASSWORD = 'todak1q2w3e';
let tables = [];
let participants = [...attendanceData];

// Check if already logged in
if (localStorage.getItem('adminLoggedIn') === 'true') {
    showAdminContent();
    loadFromDatabase(); // Load from database on page load
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
    loadFromDatabase(); // Always load from database when showing admin content
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
        tableCard.dataset.tableNumber = table.number;
        
        tableCard.innerHTML = `
            <div class="table-header">
                <h3>Table ${table.number}</h3>
                <span class="table-capacity">${assignedParticipants.length} / ${table.seats}</span>
            </div>
            <div class="table-participants" data-table="${table.number}">
                ${assignedParticipants.map(p => `
                    <div class="participant-chip ${p.vip ? 'vip' : ''}" 
                         draggable="true" 
                         data-participant-id="${p.id}"
                         ondragstart="handleDragStart(event)"
                         ondragend="handleDragEnd(event)">
                        ${p.name}
                        <button onclick="removeFromTable(${p.id})" class="remove-btn">×</button>
                    </div>
                `).join('') || '<p class="empty-table">No participants assigned</p>'}
            </div>
        `;
        
        // Add drop zone listeners
        const participantsContainer = tableCard.querySelector('.table-participants');
        participantsContainer.addEventListener('dragover', handleDragOver);
        participantsContainer.addEventListener('drop', handleDrop);
        participantsContainer.addEventListener('dragenter', handleDragEnter);
        participantsContainer.addEventListener('dragleave', handleDragLeave);
        
        container.appendChild(tableCard);
    });
}

// Drag and Drop handlers
function handleDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('participantId', e.target.dataset.participantId);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    const tableCard = e.currentTarget.closest('.table-card');
    if (tableCard) {
        tableCard.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const tableCard = e.currentTarget.closest('.table-card');
    if (tableCard && !tableCard.contains(e.relatedTarget)) {
        tableCard.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    e.preventDefault();
    
    const participantId = parseInt(e.dataTransfer.getData('participantId'));
    const newTableNumber = parseInt(e.currentTarget.dataset.table);
    
    // Remove drag-over class
    document.querySelectorAll('.table-card').forEach(card => {
        card.classList.remove('drag-over');
    });
    
    // Assign to new table
    if (participantId && newTableNumber) {
        console.log(`Moving participant ${participantId} to table ${newTableNumber}`);
        assignTable(participantId, newTableNumber);
    }
    
    return false;
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
            <td>${p.checkedIn ? '<span class="badge-success">✓ Checked In</span>' : '<span class="badge-pending">Not Yet</span>'}</td>
            <td>
                <button onclick="editParticipant(${p.id})" class="btn-small" title="Edit">✏️</button>
                <button onclick="deleteParticipant(${p.id})" class="btn-small btn-danger" title="Delete">🗑️</button>
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
    const checkedInOnly = document.getElementById('filterCheckedIn').checked;
    
    return participants.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search) || 
                            p.company.toLowerCase().includes(search);
        const matchesVIP = !vipOnly || p.vip;
        const matchesCheckedIn = !checkedInOnly || p.checkedIn;
        return matchesSearch && matchesVIP && matchesCheckedIn;
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
    
    // Clear all assignments first
    participants.forEach(p => p.table = null);
    
    // Separate VIPs and non-VIPs, keep original order (by ID)
    const vips = participants.filter(p => p.vip).sort((a, b) => a.id - b.id);
    const nonVips = participants.filter(p => !p.vip).sort((a, b) => a.id - b.id);
    
    // Combine: VIPs first in their original order, then non-VIPs
    const sorted = [...vips, ...nonVips];
    
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
    alert(`✓ Table assignment completed!\n\nVIPs assigned to first ${Math.ceil(vips.length / tables[0].seats)} tables\nAll ${totalParticipants} participants assigned`);
}

async function clearAllTables() {
    console.log('clearAllTables function called');
    
    // Count current assignments
    const assignedCount = participants.filter(p => p.table !== null).length;
    
    if (assignedCount === 0) {
        alert('No table assignments to clear.');
        return;
    }
    
    console.log(`Clearing ${assignedCount} table assignments...`);
    showSyncStatus('Clearing tables...');
    
    // Clear locally
    participants.forEach(p => p.table = null);
    
    // Save to database
    if (window.dbAPI) {
        const result = await window.dbAPI.saveParticipants(participants, tables);
        console.log('Clear result:', result);
        
        if (!result.success) {
            alert('Failed to clear in database: ' + result.error);
            return;
        }
    }
    
    // Also save locally
    localStorage.setItem('participants', JSON.stringify(participants));
    
    // Update UI
    renderTables();
    renderParticipantsTable();
    updateStats();
    showSyncStatus('Tables cleared ✓');
    
    alert(`✓ All table assignments have been cleared!\n\n${assignedCount} participants were removed from tables.`);
}

async function resetAllCheckIns() {
    console.log('resetAllCheckIns function called');
    
    const checkedInCount = participants.filter(p => p.checkedIn).length;
    
    if (checkedInCount === 0) {
        alert('No check-ins to reset.');
        return;
    }
    
    console.log(`Resetting ${checkedInCount} check-ins...`);
    showSyncStatus('Resetting check-ins...');
    
    // Clear all check-ins
    participants.forEach(p => {
        p.checkedIn = false;
        p.checkedInAt = null;
    });
    
    // Save to database
    if (window.dbAPI) {
        const result = await window.dbAPI.saveParticipants(participants, tables);
        console.log('Reset result:', result);
        
        if (!result.success) {
            alert('Failed to reset in database: ' + result.error);
            return;
        }
    }
    
    // Also save locally
    localStorage.setItem('participants', JSON.stringify(participants));
    
    renderParticipantsTable();
    updateStats();
    showSyncStatus('Check-ins reset ✓');
    
    alert(`✓ All check-ins have been reset!\n\n${checkedInCount} participants were marked as not checked in.`);
}

function exportData() {
    const data = {
        participants: participants,
        tables: tables,
        lastUpdated: new Date().toISOString(),
        version: Date.now()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `event-data.json`;
    link.click();
    
    // Show publish instructions
    setTimeout(() => {
        alert(`✓ File downloaded: event-data.json

🚀 IMPORTANT: Publish to make it live for all users!

Option 1 - GitHub Web (Easiest):
1. Go to: https://github.com/broneotodak/TAD
2. Navigate to 'data' folder
3. Click 'event-data.json'
4. Click pencil icon (Edit)
5. Delete all content and paste the new data
6. Scroll down → Commit changes
7. Done! All users will see updates within 10 seconds

Option 2 - Local Git:
1. Replace data/event-data.json with downloaded file
2. Run: git add data/event-data.json
3. Run: git commit -m "Update event data"
4. Run: git push

⚠️ Users scan QR → They read from GitHub → They see your table assignments!`);
    }, 500);
}

function generateQRCode() {
    // Open the QR page in a new window
    window.open('qr-checkin.html', '_blank');
}

function closeQRModal() {
    // No longer needed but kept for compatibility
}

function viewParticipant(id) {
    editParticipant(id);
}

async function editParticipant(id) {
    const participant = participants.find(p => p.id === id);
    if (!participant) return;
    
    // Show current info
    alert(`Editing Participant #${participant.id}\n\nCurrent Info:\nName: ${participant.name}\nCompany: ${participant.company}\nVIP: ${participant.vip ? 'YES' : 'NO'}\nTable: ${participant.table || 'Not assigned'}`);
    
    // Edit name
    const name = prompt('Step 1/4: Edit full name:', participant.name);
    if (name === null) return; // User cancelled
    if (name.trim() === '') {
        alert('Name cannot be empty!');
        return;
    }
    
    // Edit company
    const company = prompt('Step 2/4: Edit company/organization:', participant.company);
    if (company === null) return; // User cancelled
    
    // Edit VIP status
    const isVIP = confirm(`Step 3/4: Is ${name.trim()} a VIP?\n\nCurrent: ${participant.vip ? 'YES' : 'NO'}\n\nClick OK for YES, Cancel for NO`);
    
    // Ask about table assignment
    let newTable = participant.table;
    if (tables.length > 0) {
        const tableInput = prompt(`Step 4/4: Assign to table number (1-${tables.length}):\n\nCurrent: ${participant.table || 'Not assigned'}\n\nLeave empty for no assignment:`, participant.table || '');
        if (tableInput !== null) {
            if (tableInput === '') {
                newTable = null;
            } else {
                const tableNum = parseInt(tableInput);
                if (tableNum >= 1 && tableNum <= tables.length) {
                    newTable = tableNum;
                } else {
                    alert(`Invalid table number! Must be between 1 and ${tables.length}`);
                    return;
                }
            }
        }
    }
    
    // Update locally
    participant.name = name.trim();
    participant.company = company ? company.trim() : participant.company;
    participant.vip = isVIP;
    participant.table = newTable;
    
    // Save to database
    if (window.dbAPI) {
        const result = await window.dbAPI.updateParticipant(
            participant.id,
            participant.name,
            participant.company,
            participant.vip,
            participant.table
        );
        
        if (result.success) {
            showSyncStatus('Updated ✓');
        } else {
            alert('Failed to update in database: ' + result.error);
            return;
        }
    }
    
    // Save locally and refresh
    saveData();
    renderTables();
    renderParticipantsTable();
    updateStats();
    
    alert(`✓ Participant updated!\n\nName: ${participant.name}\nCompany: ${participant.company}\nVIP: ${participant.vip ? 'Yes' : 'No'}\nTable: ${participant.table || 'Not assigned'}`);
}

async function deleteParticipant(id) {
    const participant = participants.find(p => p.id === id);
    if (!participant) {
        console.error('Participant not found:', id);
        return;
    }
    
    if (!confirm(`⚠️ DELETE PARTICIPANT?\n\nName: ${participant.name}\nCompany: ${participant.company}\nVIP: ${participant.vip ? 'YES' : 'NO'}\n\nThis action cannot be undone!`)) {
        console.log('Delete cancelled by user');
        return;
    }
    
    console.log('Deleting participant:', id, participant.name);
    
    try {
        // Delete from database
        if (window.dbAPI) {
            showSyncStatus('Deleting...');
            const result = await window.dbAPI.deleteParticipant(id);
            console.log('Delete result:', result);
            
            if (result.success) {
                console.log('✅ Deleted from database');
                
                // Remove from local array
                const index = participants.findIndex(p => p.id === id);
                if (index > -1) {
                    participants.splice(index, 1);
                    console.log('Removed from local array');
                }
                
                // Update UI
                renderParticipantsTable();
                renderTables();
                updateStats();
                showSyncStatus('Deleted ✓');
                
                alert(`✓ Participant deleted successfully!\n\n${participant.name} has been removed.`);
            } else {
                console.error('Delete failed:', result.error);
                alert('Failed to delete: ' + result.error);
                showSyncStatus('Delete failed ✗');
            }
        } else {
            alert('Database API not available');
        }
    } catch (error) {
        console.error('Delete exception:', error);
        alert('Error deleting participant: ' + error.message);
        showSyncStatus('Delete error ✗');
    }
}

async function migrateToDatabase() {
    console.log('🔄 Starting migration process...');
    
    if (!window.dbAPI) {
        console.error('Database API not available');
        alert('Database API not available');
        return;
    }
    
    console.log(`Total participants to migrate: ${attendanceData.length}`);
    
    // Remove confirmation - just start migration immediately
    try {
        showSyncStatus('Migrating data...');
        console.log('Calling migrateData API...');
        
        const result = await window.dbAPI.migrateData(attendanceData);
        console.log('Migration result:', result);
        
        if (result.success) {
            console.log('✅ Migration successful');
            alert(`✅ Migration Complete!\n\nMigrated: ${result.migrated}\nSkipped: ${result.skipped}\nTotal: ${result.total}`);
            
            // Reload from database
            console.log('Reloading data from database...');
            const data = await window.dbAPI.getParticipants(false);
            console.log('Reload result:', data);
            
            if (data.success) {
                participants = data.data.participants;
                renderParticipantsTable();
                updateStats();
                showSyncStatus('Migration complete ✓');
            }
        } else {
            console.error('Migration failed:', result.error);
            alert('Migration failed: ' + (result.error || 'Unknown error'));
            showSyncStatus('Migration failed ✗');
        }
    } catch (error) {
        console.error('Migration exception:', error);
        alert('Migration error: ' + error.message);
        showSyncStatus('Migration error ✗');
    }
}

async function addNewParticipant() {
    // Step 1: Name
    const name = prompt('Step 1/3: Enter participant full name:');
    if (!name || name.trim() === '') {
        alert('Name is required!');
        return;
    }
    
    // Step 2: Company
    const company = prompt('Step 2/3: Enter company/organization:', 'N/A');
    if (company === null) return; // User cancelled
    
    // Step 3: VIP Status
    const isVIP = confirm(`Step 3/3: Is ${name.trim()} a VIP?\n\nClick OK for YES\nClick Cancel for NO`);
    
    // Check table capacity if tables exist
    if (tables.length > 0) {
        const totalCapacity = tables.reduce((sum, table) => sum + table.seats, 0);
        const currentCount = participants.length;
        const assignedCount = participants.filter(p => p.table !== null).length;
        
        if (assignedCount >= totalCapacity) {
            alert(`⚠️ Warning: All tables are full!\n\nTotal Capacity: ${totalCapacity}\nCurrent Participants: ${currentCount}\n\nYou can still add this participant, but you'll need to add more tables or increase capacity.`);
        }
    }
    
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
    
    // Add to local array
    participants.push(newParticipant);
    
    // Save to database
    if (window.dbAPI) {
        const result = await window.dbAPI.saveParticipants(participants, tables);
        if (result.success) {
            console.log('✅ New participant saved to database');
        }
    }
    
    // Save locally and refresh
    saveData();
    renderParticipantsTable();
    updateStats();
    
    alert(`✓ Participant "${name}" added successfully!\n\nID: ${newParticipant.id}\nCompany: ${company}\nVIP: ${isVIP ? 'Yes' : 'No'}`);
}

async function saveData() {
    // Save to localStorage as backup
    localStorage.setItem('participants', JSON.stringify(participants));
    localStorage.setItem('tables', JSON.stringify(tables));
    localStorage.setItem('lastSave', new Date().toISOString());
    
    // Save to database
    if (window.dbAPI) {
        showSyncStatus('Saving to database...');
        const result = await window.dbAPI.saveParticipants(participants, tables);
        
        if (result.success) {
            console.log('✅ Data saved to database');
            showSyncStatus('Saved to database ✓');
        } else {
            console.error('Failed to save to database:', result.error);
            showSyncStatus('Saved locally only ⚠️');
        }
    } else {
        console.log('💾 Data saved locally');
        showSyncStatus('Saved locally ✓');
    }
}

function showSyncStatus(message) {
    // Find or create status indicator
    let statusEl = document.getElementById('syncStatus');
    if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.id = 'syncStatus';
        statusEl.style.cssText = 'position: fixed; top: 80px; right: 20px; background: #ffffff; color: #000000; padding: 12px 24px; border-radius: 8px; z-index: 1000; font-size: 0.9rem; font-weight: 600; opacity: 0; transition: opacity 0.3s; box-shadow: 0 4px 12px rgba(255,255,255,0.3);';
        document.body.appendChild(statusEl);
    }
    
    statusEl.textContent = message;
    statusEl.style.opacity = '1';
    
    setTimeout(() => {
        statusEl.style.opacity = '0';
    }, 3000);
}

async function loadFromDatabase() {
    if (!window.dbAPI) {
        console.log('Database API not available, using localStorage');
        loadSavedData();
        return;
    }
    
    try {
        console.log('📥 Loading data from database...');
        const result = await window.dbAPI.getParticipants(false); // Don't use cache
        
        if (result.success && result.data) {
            participants = result.data.participants || [];
            tables = result.data.tables || [];
            
            console.log(`✅ Loaded from database: ${participants.length} participants, ${tables.length} tables`);
            
            // Update UI
            renderParticipantsTable();
            if (tables.length > 0) {
                renderTables();
            }
            updateStats();
            showSyncStatus('Data loaded from database ✓');
        } else {
            console.log('⚠️ No data in database, using local');
            loadSavedData();
        }
    } catch (error) {
        console.error('Failed to load from database:', error);
        loadSavedData();
    }
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

