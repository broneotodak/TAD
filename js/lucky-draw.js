// Lucky Draw JavaScript
let participants = [];
let winners = [];
let isDrawing = false;
let drawInterval = null;

// Load data with cloud sync
if (window.realtimeSync) {
    window.realtimeSync.pullFromCloud().then(result => {
        if (result.success && result.data) {
            participants = result.data.participants;
            console.log('✅ Loaded participants from cloud');
        } else {
            loadData();
        }
        updateCounts();
    });
    
    // Enable auto-refresh
    window.realtimeSync.enableAutoSync(30);
} else {
    loadData();
    updateCounts();
}

function loadData() {
    const savedParticipants = localStorage.getItem('participants');
    if (savedParticipants) {
        participants = JSON.parse(savedParticipants);
    } else {
        participants = [...attendanceData];
    }
    
    const savedWinners = localStorage.getItem('luckyDrawWinners');
    if (savedWinners) {
        winners = JSON.parse(savedWinners);
        displayWinners();
    }
}

function saveWinners() {
    localStorage.setItem('luckyDrawWinners', JSON.stringify(winners));
}

function updateCounts() {
    const allowMultiple = document.getElementById('allowMultipleWins').checked;
    let eligible;
    
    if (allowMultiple) {
        // Only checked-in participants are eligible
        eligible = participants.filter(p => p.checkedIn);
    } else {
        // Checked-in participants who haven't won yet
        eligible = participants.filter(p => p.checkedIn && !winners.find(w => w.id === p.id));
    }
    
    document.getElementById('eligibleCount').textContent = eligible.length;
    document.getElementById('winnersCount').textContent = winners.length;
}

function updateEligibleCount() {
    updateCounts();
}

function getEligibleParticipants() {
    const allowMultiple = document.getElementById('allowMultipleWins').checked;
    
    if (allowMultiple) {
        return participants.filter(p => p.checkedIn);
    } else {
        return participants.filter(p => p.checkedIn && !winners.find(w => w.id === p.id));
    }
}

function startDraw() {
    const eligible = getEligibleParticipants();
    
    if (eligible.length === 0) {
        alert('No eligible participants for the lucky draw! Make sure participants have checked in.');
        return;
    }
    
    isDrawing = true;
    document.getElementById('startDrawBtn').style.display = 'none';
    document.getElementById('stopDrawBtn').style.display = 'block';
    document.getElementById('winnerDisplay').style.display = 'none';
    
    const rollingContainer = document.getElementById('rollingNames');
    rollingContainer.style.display = 'block';
    
    // Animate rolling names
    let index = 0;
    drawInterval = setInterval(() => {
        const randomParticipant = eligible[Math.floor(Math.random() * eligible.length)];
        rollingContainer.innerHTML = `
            <div class="rolling-name animate">
                <div class="name">${randomParticipant.name}</div>
                <div class="company">${randomParticipant.company}</div>
            </div>
        `;
        index++;
    }, 100);
}

function stopDraw() {
    if (!isDrawing) return;
    
    clearInterval(drawInterval);
    isDrawing = false;
    
    const eligible = getEligibleParticipants();
    
    if (eligible.length === 0) {
        alert('No eligible participants!');
        resetDrawUI();
        return;
    }
    
    // Select random winner
    const winner = eligible[Math.floor(Math.random() * eligible.length)];
    
    // Add to winners list
    winners.push({
        ...winner,
        wonAt: new Date().toISOString()
    });
    saveWinners();
    
    // Display winner
    setTimeout(() => {
        document.getElementById('rollingNames').style.display = 'none';
        const winnerDisplay = document.getElementById('winnerDisplay');
        winnerDisplay.style.display = 'block';
        
        document.getElementById('winnerName').textContent = winner.name;
        document.getElementById('winnerCompany').textContent = winner.company;
        document.getElementById('winnerTable').textContent = winner.table || 'Not Assigned';
        
        // Celebration animation
        confetti();
        
        // Update counts and display
        updateCounts();
        displayWinners();
        
        // Reset buttons after 3 seconds
        setTimeout(() => {
            resetDrawUI();
        }, 3000);
    }, 500);
}

function resetDrawUI() {
    document.getElementById('startDrawBtn').style.display = 'block';
    document.getElementById('stopDrawBtn').style.display = 'none';
}

function displayWinners() {
    const winnersList = document.getElementById('winnersList');
    
    if (winners.length === 0) {
        winnersList.innerHTML = '<p class="no-winners">No winners yet. Start the lucky draw!</p>';
        return;
    }
    
    winnersList.innerHTML = winners.map((w, index) => `
        <div class="winner-card">
            <div class="winner-number">#${winners.length - index}</div>
            <div class="winner-details">
                <div class="winner-card-name">${w.name}</div>
                <div class="winner-card-company">${w.company}</div>
                <div class="winner-card-table">Table: ${w.table || 'N/A'}</div>
            </div>
            <button onclick="removeWinner(${index})" class="remove-winner-btn">×</button>
        </div>
    `).reverse().join('');
}

function removeWinner(index) {
    if (confirm('Remove this winner from the list?')) {
        winners.splice(index, 1);
        saveWinners();
        displayWinners();
        updateCounts();
    }
}

function resetAllWinners() {
    if (confirm('Are you sure you want to reset all winners? This cannot be undone.')) {
        winners = [];
        saveWinners();
        displayWinners();
        updateCounts();
    }
}

// Simple confetti effect
function confetti() {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const colors = ['#FF6B35', '#F8961E', '#06D6A0', '#EF476F', '#4ECDC4'];
    
    const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        
        if (timeLeft <= 0) {
            return clearInterval(interval);
        }
        
        const particleCount = 3;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.width = '10px';
            particle.style.height = '10px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.left = Math.random() * window.innerWidth + 'px';
            particle.style.top = '-10px';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '9999';
            particle.style.transition = 'all 3s ease-out';
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                particle.style.top = window.innerHeight + 'px';
                particle.style.opacity = '0';
            }, 10);
            
            setTimeout(() => {
                particle.remove();
            }, 3000);
        }
    }, 50);
}

