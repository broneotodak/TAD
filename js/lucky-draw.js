// Lucky Draw JavaScript
let participants = [];
let winners = [];
let isDrawing = false;
let drawInterval = null;
let audioContext = null;
let drumrollInterval = null;

// Initialize audio context
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

// Play drumroll sound - more intense and rising
function playDrumroll() {
    const ctx = initAudio();
    let intensity = 0.1;
    let speed = 150;
    
    drumrollInterval = setInterval(() => {
        // Create multiple oscillators for richer sound
        [80, 120, 160].forEach((baseFreq, index) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.frequency.value = baseFreq + (Math.random() * 20);
            oscillator.type = index === 0 ? 'sine' : 'triangle';
            
            const volume = intensity * (1 - index * 0.3);
            gainNode.gain.setValueAtTime(volume, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.15);
        });
        
        // Increase intensity over time for tension
        intensity = Math.min(0.3, intensity + 0.002);
        speed = Math.max(80, speed - 0.5);
    }, speed);
}

// Stop drumroll
function stopDrumroll() {
    if (drumrollInterval) {
        clearInterval(drumrollInterval);
        drumrollInterval = null;
    }
}

// Play tick sound for each name change
function playTickSound() {
    const ctx = initAudio();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Quick high-pitched tick
    oscillator.frequency.value = 1200 + (Math.random() * 400);
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
}

// Play celebration sound - enhanced triumphant fanfare!
function playCelebration() {
    const ctx = initAudio();
    
    // Enhanced fanfare: Play multiple ascending chord sequences with richer harmonics
    const fanfare = [
        // First chord - triumphant start (C major)
        { notes: [523.25, 659.25, 783.99, 1046.50], time: 0, duration: 0.4 },
        // Second chord - higher (G major)
        { notes: [659.25, 783.99, 987.77, 1318.51], time: 0.3, duration: 0.4 },
        // Third chord - even higher (C major octave)
        { notes: [783.99, 987.77, 1174.66, 1567.98], time: 0.6, duration: 0.5 },
        // Final chord - victory! (C major with high octave)
        { notes: [1046.50, 1318.51, 1567.98, 2093.00], time: 0.9, duration: 0.8 }
    ];
    
    fanfare.forEach(chord => {
        chord.notes.forEach((freq, noteIndex) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.frequency.value = freq;
            // Use different wave types for richer sound
            if (noteIndex === chord.notes.length - 1) {
                oscillator.type = 'sine'; // Smooth high note
            } else if (noteIndex === 0) {
                oscillator.type = 'triangle'; // Warm base
            } else {
                oscillator.type = 'sawtooth'; // Bright middle
            }
            
            const startTime = ctx.currentTime + chord.time;
            const volume = 0.2 + (noteIndex * 0.03);
            gainNode.gain.setValueAtTime(volume, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + chord.duration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + chord.duration);
        });
    });
    
    // Enhanced sparkle sounds with more variety
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            // More varied frequencies for sparkle effect
            osc.frequency.value = 1500 + (Math.random() * 1500);
            osc.type = i % 2 === 0 ? 'sine' : 'triangle';
            
            const volume = 0.1 + (Math.random() * 0.05);
            gain.gain.setValueAtTime(volume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.25);
        }, i * 80);
    }
    
    // Add a final "whoosh" sound effect
    setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3);
        osc.type = 'sawtooth';
        
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    }, 1200);
}

// Load data from database
const urlParams = new URLSearchParams(window.location.search);
const currentEventId = urlParams.get('event');

if (window.dbAPI && currentEventId) {
    // Load participants
    window.dbAPI.getParticipants(true, currentEventId).then(result => {
        if (result.success && result.data) {
            participants = result.data.participants || [];
            console.log(`✅ Loaded ${participants.length} participants from database for event ${currentEventId}`);
        } else if (result.success && result.participants) {
             // Handle direct array return if structure differs
            participants = result.participants || [];
            console.log(`✅ Loaded ${participants.length} participants from database for event ${currentEventId}`);
        } else {
            loadData();
        }
        
        // Load winners from database
        loadWinnersFromDatabase();
        updateCounts();
    });
} else {
    loadData();
    updateCounts();
}

async function loadWinnersFromDatabase() {
    if (!currentEventId) return;
    
    try {
        const response = await fetch(`/api/get-lucky-draw-winners?eventId=${currentEventId}`);
        const result = await response.json();
        
        if (result.success) {
            winners = result.winners || [];
            displayWinners();
            console.log(`✅ Loaded ${winners.length} winners from database`);
        }
    } catch (error) {
        console.error('Error loading winners from database:', error);
        // Fallback to localStorage
        const savedWinners = localStorage.getItem('luckyDrawWinners');
        if (savedWinners) {
            winners = JSON.parse(savedWinners);
            displayWinners();
        }
    }
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

async function saveWinners() {
    // Save to localStorage as backup only
    // Database saving is handled in revealWinner() to avoid duplicate saves
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
    document.getElementById('stopDrawBtn').style.display = 'none'; // Hide stop button
    document.getElementById('winnerDisplay').style.display = 'none';
    
    const rollingContainer = document.getElementById('rollingNames');
    rollingContainer.style.display = 'block';
    
    // Start drumroll sound
    playDrumroll();
    
    // Animate rolling names - cycle through all participants for exactly 10 seconds
    // Create a shuffled array that cycles through all participants
    const shuffledParticipants = [...eligible];
    for (let i = shuffledParticipants.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledParticipants[i], shuffledParticipants[j]] = [shuffledParticipants[j], shuffledParticipants[i]];
    }
    
    // Select final winner
    const finalWinner = eligible[Math.floor(Math.random() * eligible.length)];
    
    const startTime = Date.now();
    const totalDuration = 10000; // Exactly 10 seconds
    let currentIndex = 0;
    let hasShownWinner = false;
    
    function updateName() {
        if (!isDrawing) return;
        
        const elapsed = Date.now() - startTime;
        const remaining = totalDuration - elapsed;
        const progress = elapsed / totalDuration;
        
        // Calculate delay based on progress - smooth deceleration curve
        let currentDelay;
        
        // Use exponential easing for smooth deceleration
        // Fast at start (50ms), gradually slowing down to very slow at end (800ms)
        // Using ease-out cubic curve: 1 - (1 - t)^3
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        currentDelay = 50 + (easedProgress * 750); // Range: 50ms to 800ms
        
        // When we're very close to the end (last 200ms), show the winner
        if (remaining <= 200 && !hasShownWinner) {
            // Show winner name in rolling container first
            rollingContainer.innerHTML = `
                <div class="rolling-name animate">
                    <div class="name">${finalWinner.name}</div>
                    <div class="company">${finalWinner.company}</div>
                </div>
            `;
            hasShownWinner = true;
            playTickSound();
            
            // Wait a brief moment then reveal winner display
            drawInterval = setTimeout(() => {
                revealWinner(finalWinner);
            }, 150);
            return;
        }
        
        // If we've already shown the winner, don't continue
        if (hasShownWinner) {
            return;
        }
        
        // Ensure we don't exceed remaining time
        currentDelay = Math.min(currentDelay, remaining - 250);
        
        // Pick next participant (cycle through shuffled array, but never show winner until the end)
        let participant;
        do {
            participant = shuffledParticipants[currentIndex % shuffledParticipants.length];
            currentIndex++;
        } while (participant.id === finalWinner.id && remaining > 200);
        
        rollingContainer.innerHTML = `
            <div class="rolling-name animate">
                <div class="name">${participant.name}</div>
                <div class="company">${participant.company}</div>
            </div>
        `;
        
        // Play tick sound for each name change
        playTickSound();
        
        // Schedule next update
        drawInterval = setTimeout(updateName, currentDelay);
    }
    
    // Start the animation
    updateName();
}

async function revealWinner(winner) {
    if (!isDrawing) return;
    
    // Clear any pending intervals/timeouts
    if (drawInterval) {
        clearTimeout(drawInterval);
        drawInterval = null;
    }
    isDrawing = false;
    
    // Stop drumroll
    stopDrumroll();
    
    // Add to winners list
    const winnerData = {
        ...winner,
        wonAt: new Date().toISOString()
    };
    winners.push(winnerData);
    saveWinners();
    
    // Save to database if event ID is available
    const urlParams = new URLSearchParams(window.location.search);
    const currentEventId = urlParams.get('event');
    if (currentEventId && window.dbAPI) {
        try {
            const response = await fetch('/api/save-lucky-draw-winner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: currentEventId,
                    participantId: winner.id
                })
            });
            const result = await response.json();
            if (result.success) {
                console.log('Winner saved to database');
            } else {
                console.warn('Failed to save winner to database:', result.error);
            }
        } catch (error) {
            console.error('Error saving winner to database:', error);
        }
    }
    
    // Display winner
    document.getElementById('rollingNames').style.display = 'none';
    const winnerDisplay = document.getElementById('winnerDisplay');
    winnerDisplay.style.display = 'block';
    
    document.getElementById('winnerName').textContent = winner.name;
    document.getElementById('winnerCompany').textContent = winner.company;
    document.getElementById('winnerTable').textContent = winner.table || 'Not Assigned';
    
    // Play celebration sound
    playCelebration();
    
    // Celebration animation
    confetti();
    
    // Update counts and display
    updateCounts();
    displayWinners();
    
    // Reset buttons after 3 seconds
    setTimeout(() => {
        resetDrawUI();
    }, 3000);
}

function stopDraw() {
    // This function is kept for backward compatibility but may not be used anymore
    if (!isDrawing) return;
    
    if (drawInterval) {
        clearTimeout(drawInterval);
        drawInterval = null;
    }
    isDrawing = false;
    
    // Stop drumroll
    stopDrumroll();
    
    const eligible = getEligibleParticipants();
    
    if (eligible.length === 0) {
        alert('No eligible participants!');
        resetDrawUI();
        return;
    }
    
    // Select random winner
    const winner = eligible[Math.floor(Math.random() * eligible.length)];
    revealWinner(winner);
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

async function resetAllWinners() {
    if (!confirm('Are you sure you want to reset all winners? This cannot be undone.')) {
        return;
    }
    
    winners = [];
    localStorage.setItem('luckyDrawWinners', JSON.stringify(winners));
    
    // Clear winners from database if event ID is available
    if (currentEventId) {
        try {
            const response = await fetch('/api/reset-lucky-draw-winners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId: currentEventId })
            });
            
            const result = await response.json();
            if (result.success) {
                console.log('✅ Winners cleared from database');
            } else {
                console.warn('Failed to clear winners from database:', result.error);
            }
        } catch (error) {
            console.error('Error clearing winners from database:', error);
        }
    }
    
    // Reload winners from database to ensure UI is updated
    await loadWinnersFromDatabase();
    
    // Clear the winner display
    document.getElementById('winnerDisplay').style.display = 'none';
    document.getElementById('rollingNames').style.display = 'none';
    document.getElementById('winnerName').textContent = '';
    document.getElementById('winnerCompany').textContent = '';
    document.getElementById('winnerTable').textContent = '';
    
    // Stop any ongoing draw
    if (drawInterval) {
        clearTimeout(drawInterval);
        drawInterval = null;
    }
    if (isDrawing) {
        isDrawing = false;
        stopDrumroll();
    }
    
    // Reset UI
    resetDrawUI();
    
    displayWinners();
    updateCounts();
    alert('✓ All winners have been reset!');
}

// Simple confetti effect
function confetti() {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const colors = ['#000000', '#333333', '#666666', '#999999', '#cccccc'];
    
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

function toggleHistory() {
    const section = document.getElementById('winnersSection');
    const btn = document.querySelector('button[onclick="toggleHistory()"]');
    
    if (!section) return;
    
    // Check if currently hidden (either by inline style or css)
    const isHidden = section.style.display === 'none' || getComputedStyle(section).display === 'none';
    
    if (isHidden) {
        section.style.display = 'block';
        if (btn) btn.textContent = 'Hide History';
    } else {
        section.style.display = 'none';
        if (btn) btn.textContent = 'Show History';
    }
}

