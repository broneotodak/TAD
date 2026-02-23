// Event Wizard JavaScript

let currentStep = 1;
const totalSteps = 4;

// Event data
const eventData = {
    name: '',
    date: '',
    venue: '',
    theme: '',
    timeStart: '',
    timeEnd: '',
    eventType: '',
    features: {
        attendance: true,
        tables: true,
        luckyDraw: true
    },
    participants: []
};

// Load theme
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// Navigation
function nextStep() {
    if (!validateStep(currentStep)) {
        return;
    }

    saveStepData(currentStep);

    if (currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
}

function showStep(step) {
    // Hide all steps
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));

    // Show current step
    const stepElement = document.querySelector(`.wizard-step[data-step="${step}"]`);
    if (stepElement) {
        stepElement.classList.add('active');
    }

    // Update progress bar
    updateProgressBar(step);

    // Update buttons
    updateButtons(step);
}

function updateProgressBar(step) {
    const progressSteps = document.querySelectorAll('.progress-step');
    const progressLine = document.getElementById('progressLine');

    progressSteps.forEach((ps, index) => {
        const stepNum = index + 1;
        if (stepNum < step) {
            ps.classList.add('completed');
            ps.classList.remove('active');
        } else if (stepNum === step) {
            ps.classList.add('active');
            ps.classList.remove('completed');
        } else {
            ps.classList.remove('active', 'completed');
        }
    });

    // Update progress line width
    const percentage = ((step - 1) / (totalSteps - 1)) * 100;
    progressLine.style.width = `${percentage}%`;
}

function updateButtons(step) {
    const btnBack = document.getElementById('btnBack');
    const btnNext = document.getElementById('btnNext');
    const btnCreate = document.getElementById('btnCreate');

    // Back button
    btnBack.style.display = step > 1 ? 'block' : 'none';

    // Next/Create buttons
    if (step === totalSteps) {
        btnNext.style.display = 'none';
        btnCreate.style.display = 'block';
    } else {
        btnNext.style.display = 'block';
        btnCreate.style.display = 'none';
    }
}

// Validation
function validateStep(step) {
    switch (step) {
        case 1:
            const name = document.getElementById('eventName').value.trim();
            const date = document.getElementById('eventDate').value;

            if (!name) {
                alert('Please enter an event name');
                return false;
            }
            if (!date) {
                alert('Please select an event date');
                return false;
            }
            return true;

        case 2:
            if (!eventData.eventType) {
                alert('Please select an event type');
                return false;
            }
            return true;

        case 3:
            // Features are optional, always valid
            return true;

        case 4:
            // Participants are optional
            return true;

        default:
            return true;
    }
}

// Save step data
function saveStepData(step) {
    switch (step) {
        case 1:
            eventData.name = document.getElementById('eventName').value.trim();
            eventData.date = document.getElementById('eventDate').value;
            eventData.venue = document.getElementById('eventVenue').value.trim();
            eventData.theme = document.getElementById('eventTheme').value.trim();
            eventData.timeStart = document.getElementById('eventTimeStart').value;
            eventData.timeEnd = document.getElementById('eventTimeEnd').value;
            break;

        case 2:
            // Event type already saved in selectEventType()
            break;

        case 3:
            // Features already saved in toggleFeature()
            break;

        case 4:
            // Participants handled separately
            break;
    }
}

// Event type selection
function selectEventType(type) {
    eventData.eventType = type;

    // Update UI
    document.querySelectorAll('.event-type-option').forEach(option => {
        option.classList.remove('selected');
    });

    event.currentTarget.classList.add('selected');
}

// Feature toggles
function toggleFeature(featureName) {
    const toggle = document.querySelector(`.toggle-switch[data-feature="${featureName}"]`);
    const container = toggle.parentElement;

    toggle.classList.toggle('active');
    container.classList.toggle('active');

    eventData.features[featureName] = toggle.classList.contains('active');
}

// File upload handling
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    processFile(file);
}

// Drag and drop
const uploadArea = document.getElementById('uploadArea');

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');

    const file = e.dataTransfer.files[0];
    if (file) {
        processFile(file);
    }
});

// Process uploaded file
async function processFile(file) {
    const allowedTypes = [
        'application/pdf',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    // Also allow files with .csv extension (some browsers report different MIME types)
    const isCSV = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';

    if (!isCSV && !allowedTypes.includes(file.type)) {
        alert('Please upload a PDF, CSV, or Excel file');
        return;
    }

    // Show processing UI
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('processingSection').style.display = 'block';

    try {
        // Read file content
        const fileContent = await readFileContent(file);

        // Use non-AI CSV parser for CSV files (faster, no token limits, handles all rows)
        // Only use AI for non-CSV files (PDF, Excel) that need intelligent extraction
        const apiEndpoint = isCSV ? '/api/parse-todak-csv' : '/api/upload-participants-ai';

        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                eventId: 0, // Temporary, will be replaced when event is created
                fileContent: fileContent,
                fileName: file.name
            })
        });

        const result = await response.json();

        if (result.success) {
            eventData.participants = result.participants;
            alert(`✅ Successfully extracted ${result.count} participants!\n\nYou can review and edit them after creating the event.`);
        } else {
            throw new Error(result.error || 'Failed to extract participants');
        }

    } catch (error) {
        console.error('Error processing file:', error);
        alert('Failed to process file: ' + error.message);
    } finally {
        // Reset UI
        document.getElementById('uploadSection').style.display = 'block';
        document.getElementById('processingSection').style.display = 'none';
    }
}

// Read file content
function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            if (file.type === 'application/pdf') {
                // For PDF, we'll send the base64 content
                // In production, you'd use a PDF parser
                resolve(e.target.result);
            } else {
                // For CSV/Excel, send as text
                resolve(e.target.result);
            }
        };

        reader.onerror = reject;

        if (file.type === 'application/pdf') {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    });
}

// Skip participants
function skipParticipants() {
    eventData.participants = [];
    // Just continue, no validation needed
}

// Create event
async function createNewEvent() {
    try {
        // Save final step data
        saveStepData(currentStep);

        // Show loading state
        const btnCreate = document.getElementById('btnCreate');
        btnCreate.disabled = true;
        btnCreate.textContent = 'Creating Event...';

        // Create event via API
        const response = await fetch('/api/create-event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: eventData.name,
                eventType: eventData.eventType,
                date: eventData.date,
                venue: eventData.venue,
                theme: eventData.theme,
                timeStart: eventData.timeStart,
                timeEnd: eventData.timeEnd,
                features: eventData.features
            })
        });

        const result = await response.json();

        if (result.success) {
            const eventId = result.event.id;

            // If we have participants, add them
            if (eventData.participants.length > 0) {
                await addParticipants(eventId, eventData.participants);
            }

            alert('✅ Event created successfully!');

            // Redirect to event management page
            window.location.href = `event-manage.html?id=${eventId}`;
        } else {
            throw new Error(result.error || 'Failed to create event');
        }

    } catch (error) {
        console.error('Error creating event:', error);
        alert('Failed to create event: ' + error.message);

        // Reset button
        const btnCreate = document.getElementById('btnCreate');
        btnCreate.disabled = false;
        btnCreate.textContent = 'Create Event';
    }
}

// Add participants to event
async function addParticipants(eventId, participants) {
    try {
        const response = await fetch('/api/add-participants-bulk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                eventId: eventId,
                participants: participants
            })
        });

        const result = await response.json();

        if (!result.success) {
            console.error('Failed to add participants:', result.error);
        }

        return result;
    } catch (error) {
        console.error('Error adding participants:', error);
        return { success: false, error: error.message };
    }
}

// Initialize
loadTheme();
updateProgressBar(1);
updateButtons(1);
