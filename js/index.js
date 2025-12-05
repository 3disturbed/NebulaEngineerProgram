// State
let lessons = [];
let users = {}; // { "username": { score: 0, completedSteps: [], completedLessons: [] } }
let currentUser = null; // "username"
let currentLesson = null;
let currentStepIndex = 0;

// Constants
const POINTS_PER_STEP = 10;
const POINTS_PER_LESSON = 50;

// DOM Elements
const lessonList = document.getElementById('lessonList');
const stepTitle = document.getElementById('stepTitle');
const stepContent = document.getElementById('stepContent');
const stepCounter = document.getElementById('stepCounter');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const labModal = document.getElementById('labModal');
const labCode = document.getElementById('labCode');
const labOutput = document.getElementById('labOutput');
const labTitle = document.getElementById('labTitle');
const stepTick = document.getElementById('stepTick');
const sectionProgressBar = document.getElementById('sectionProgressBar');
const overallProgressBar = document.getElementById('overallProgressBar');

// User Profile Elements
const welcomeModal = document.getElementById('welcomeModal');
const userListContainer = document.getElementById('userList');
const newUserNameInput = document.getElementById('newUserName');
const createUserBtn = document.getElementById('createUserBtn');
const userProfileDisplay = document.getElementById('userProfileDisplay');
const displayUserName = document.getElementById('displayUserName');
const displayUserScore = document.getElementById('displayUserScore');
const switchUserBtn = document.getElementById('switchUserBtn');

// Initialization
async function init() {
    try {
        const response = await fetch('steps/index.json');
        lessons = await response.json();
        
        loadUsers();
        
        if (!currentUser) {
            showWelcomeModal();
        } else {
            loadUserSession(currentUser);
        }
        
    } catch (error) {
        console.error('Failed to load lessons:', error);
        stepContent.innerHTML = '<div class="error">Failed to load lessons. Please check console.</div>';
    }

    setupEventListeners();
}

// User Management
function loadUsers() {
    const savedUsers = localStorage.getItem('nebulaNexusUsers');
    if (savedUsers) {
        users = JSON.parse(savedUsers);
    }
    
    const savedCurrentUser = localStorage.getItem('nebulaNexusCurrentUser');
    if (savedCurrentUser && users[savedCurrentUser]) {
        currentUser = savedCurrentUser;
    }
}

function saveUsers() {
    localStorage.setItem('nebulaNexusUsers', JSON.stringify(users));
    if (currentUser) {
        localStorage.setItem('nebulaNexusCurrentUser', currentUser);
    }
}

function createUser() {
    const name = newUserNameInput.value.trim();
    if (!name) return alert('Please enter a name');
    if (users[name]) return alert('User already exists');
    
    users[name] = {
        score: 0,
        completedSteps: [],
        completedLessons: []
    };
    
    saveUsers();
    loadUserSession(name);
    welcomeModal.style.display = 'none';
    newUserNameInput.value = '';
}

function loadUserSession(username) {
    currentUser = username;
    saveUsers();
    
    // Update UI
    userProfileDisplay.style.display = 'block';
    displayUserName.textContent = username;
    updateScoreDisplay();
    
    welcomeModal.style.display = 'none';
    
    // Load Progress
    renderSidebar();
    updateOverallProgress();
    
    // Load last position
    const savedPosition = loadPosition();
    if (savedPosition && savedPosition.lessonId) {
        loadLesson(savedPosition.lessonId, savedPosition.stepIndex);
    } else if (lessons.length > 0) {
        loadLesson(lessons[0].id);
    }
}

function showWelcomeModal() {
    welcomeModal.style.display = 'flex';
    userListContainer.innerHTML = '';
    
    Object.keys(users).forEach(username => {
        const btn = document.createElement('div');
        btn.className = 'user-select-btn';
        btn.innerHTML = `
            <span>${username}</span>
            <span>💎 ${users[username].score}</span>
        `;
        btn.onclick = () => loadUserSession(username);
        userListContainer.appendChild(btn);
    });
}

function switchUser() {
    currentUser = null;
    localStorage.removeItem('nebulaNexusCurrentUser');
    showWelcomeModal();
}

// Progress & Scoring
function getCompletedSteps() {
    return new Set(users[currentUser]?.completedSteps || []);
}

function getCompletedLessons() {
    return new Set(users[currentUser]?.completedLessons || []);
}

function updateScoreDisplay() {
    if (currentUser && users[currentUser]) {
        displayUserScore.textContent = users[currentUser].score;
    }
}

function addScore(points) {
    if (!currentUser) return;
    users[currentUser].score += points;
    updateScoreDisplay();
    saveUsers();
}

function removeScore(points) {
    if (!currentUser) return;
    users[currentUser].score = Math.max(0, users[currentUser].score - points);
    updateScoreDisplay();
    saveUsers();
}

function savePosition(lessonId, stepIndex) {
    if (!currentUser) return;
    const position = {
        lessonId: lessonId,
        stepIndex: stepIndex,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem(`nebulaNexusPosition_${currentUser}`, JSON.stringify(position));
}

function loadPosition() {
    if (!currentUser) return null;
    const saved = localStorage.getItem(`nebulaNexusPosition_${currentUser}`);
    return saved ? JSON.parse(saved) : null;
}

function toggleStepCompletion() {
    if (!currentLesson || !currentUser) return;
    
    const key = `${currentLesson.id}-${currentStepIndex}`;
    const completedSteps = getCompletedSteps();
    
    if (completedSteps.has(key)) {
        // Undo completion
        users[currentUser].completedSteps = users[currentUser].completedSteps.filter(k => k !== key);
        removeScore(POINTS_PER_STEP);
        stepTick.classList.remove('completed');
        stepTick.textContent = '✔'; 
    } else {
        // Complete
        users[currentUser].completedSteps.push(key);
        addScore(POINTS_PER_STEP);
        stepTick.classList.add('completed');
        stepTick.textContent = '✔';
    }
    
    checkLessonCompletion();
    saveUsers();
    updateSectionProgress();
    updateOverallProgress();
    renderSidebar(); 
}

function checkLessonCompletion() {
    if (!currentLesson || !currentUser) return;
    
    const completedSteps = getCompletedSteps();
    let allComplete = true;
    
    for (let i = 0; i < currentLesson.steps.length; i++) {
        if (!completedSteps.has(`${currentLesson.id}-${i}`)) {
            allComplete = false;
            break;
        }
    }
    
    const completedLessons = getCompletedLessons();
    const alreadyCompleted = completedLessons.has(currentLesson.id);
    
    if (allComplete && !alreadyCompleted) {
        users[currentUser].completedLessons.push(currentLesson.id);
        addScore(POINTS_PER_LESSON);
    } else if (!allComplete && alreadyCompleted) {
        users[currentUser].completedLessons = users[currentUser].completedLessons.filter(id => id !== currentLesson.id);
        removeScore(POINTS_PER_LESSON);
    }
}

function updateSectionProgress() {
    if (!currentLesson || !currentUser) return;
    
    const completedSteps = getCompletedSteps();
    let completedCount = 0;
    
    for (let i = 0; i < currentLesson.steps.length; i++) {
        if (completedSteps.has(`${currentLesson.id}-${i}`)) {
            completedCount++;
        }
    }
    
    const percent = (completedCount / currentLesson.steps.length) * 100;
    sectionProgressBar.style.width = `${percent}%`;
}

function updateOverallProgress() {
    if (!lessons.length || !currentUser) return;
    
    const completedLessons = getCompletedLessons();
    const percent = (completedLessons.size / lessons.length) * 100;
    overallProgressBar.style.width = `${percent}%`;
}

// Sidebar
function renderSidebar() {
    lessonList.innerHTML = '';
    const completedLessons = getCompletedLessons();
    const completedSteps = getCompletedSteps();

    lessons.forEach(lesson => {
        const li = document.createElement('li');
        li.className = 'lesson-item';
        li.dataset.id = lesson.id;
        
        const isCompleted = completedLessons.has(lesson.id);
        const tick = isCompleted ? '<span class="tick-icon completed" style="font-size: 1em;">✔</span>' : '';
        
        let progressPercent = isCompleted ? 100 : 0;
        
        // If it's the current lesson, we know the step count
        if (currentLesson && currentLesson.id === lesson.id) {
             let completedCount = 0;
            for (let i = 0; i < currentLesson.steps.length; i++) {
                if (completedSteps.has(`${currentLesson.id}-${i}`)) {
                    completedCount++;
                }
            }
            progressPercent = (completedCount / currentLesson.steps.length) * 100;
        }

        li.innerHTML = `
            <div style="flex: 1;">
                <div class="lesson-title">${lesson.title}</div>
                <div class="lesson-meta">
                    <span>${lesson.duration}</span>
                    <span>${lesson.difficulty}</span>
                </div>
                <div class="lesson-progress-track">
                    <div class="lesson-progress-fill" style="width: ${progressPercent}%"></div>
                </div>
            </div>
            ${tick}
        `;
        li.onclick = () => loadLesson(lesson.id);
        lessonList.appendChild(li);
    });
}

// Lesson Loading
async function loadLesson(lessonId, startStepIndex = 0) {
    // Update active state in sidebar
    document.querySelectorAll('.lesson-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === lessonId);
    });

    try {
        const response = await fetch(`steps/${lessonId}.json`);
        currentLesson = await response.json();
        currentStepIndex = startStepIndex;
        
        // Validate step index
        if (currentStepIndex >= currentLesson.steps.length) {
            currentStepIndex = 0;
        }
        
        renderStep();
        savePosition(lessonId, currentStepIndex);
        updateSectionProgress();
        renderSidebar(); // Re-render to update progress bar for this lesson
    } catch (error) {
        console.error(`Failed to load lesson ${lessonId}:`, error);
    }
}

// Step Rendering
function renderStep() {
    if (!currentLesson || !currentLesson.steps) return;
    
    const step = currentLesson.steps[currentStepIndex];
    
    stepTitle.textContent = step.title;
    stepCounter.textContent = `Step ${currentStepIndex + 1} of ${currentLesson.steps.length}`;
    stepContent.innerHTML = step.content;

    // Update Tick
    const key = `${currentLesson.id}-${currentStepIndex}`;
    const completedSteps = getCompletedSteps();
    
    if (completedSteps.has(key)) {
        stepTick.classList.add('completed');
    } else {
        stepTick.classList.remove('completed');
    }

    // Update buttons
    prevBtn.disabled = currentStepIndex === 0;
    nextBtn.textContent = currentStepIndex === currentLesson.steps.length - 1 ? 'Finish Lesson' : 'Next Step';

    // Highlight code
    document.querySelectorAll('code').forEach(block => {
        hljs.highlightElement(block);
    });
}

// Navigation
function nextStep() {
    if (!currentLesson) return;
    
    // Auto-complete current step when moving next
    const key = `${currentLesson.id}-${currentStepIndex}`;
    const completedSteps = getCompletedSteps();
    
    if (!completedSteps.has(key)) {
        toggleStepCompletion();
    }

    if (currentStepIndex < currentLesson.steps.length - 1) {
        currentStepIndex++;
        renderStep();
        savePosition(currentLesson.id, currentStepIndex);
    } else {
        // Lesson Complete
        checkLessonCompletion();
        saveUsers();
        renderSidebar();
        updateOverallProgress();
        alert(`Lesson Complete! 🎉 +${POINTS_PER_LESSON} XP`);
    }
}

function prevStep() {
    if (currentStepIndex > 0) {
        currentStepIndex--;
        renderStep();
        savePosition(currentLesson.id, currentStepIndex);
    }
}

// Lab Logic
window.openLab = function(labId) {
    if (typeof window.labDefinitions === 'undefined') {
        window.labDefinitions = {
            'js-basics': { title: 'JS Basics', initialCode: 'console.log("Hello World");' }
        };
    }

    const labData = window.labDefinitions[labId] || { title: 'Lab', initialCode: '// Write code here' };

    labTitle.textContent = '🧪 ' + labData.title;
    labCode.value = labData.initialCode;
    labOutput.textContent = '';
    labModal.style.display = 'block';
    
    // Reset scroll
    labCode.scrollTop = 0;
    labCode.scrollLeft = 0;
};

function closeLab() {
    labModal.style.display = 'none';
}

function runLabCode() {
    const code = labCode.value;
    const output = labOutput;

    // Capture console output
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    let outputText = '';

    const captureLog = (...args) => {
        outputText += args.map(arg => {
            if (typeof arg === 'object') {
                return JSON.stringify(arg, null, 2);
            }
            return String(arg);
        }).join(' ') + '\n';
    };

    console.log = captureLog;
    console.warn = captureLog;
    console.error = captureLog;

    try {
        eval(code);
        output.textContent = outputText || '(no output)';
        output.style.color = '#0f0';
    } catch (error) {
        output.textContent = '❌ ERROR: ' + error.message + '\n\n' + error.stack;
        output.style.color = '#ff6b6b';
    }

    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
}

// Event Listeners
function setupEventListeners() {
    prevBtn.onclick = prevStep;
    nextBtn.onclick = nextStep;
    stepTick.onclick = toggleStepCompletion;
    
    document.getElementById('closeLabModal').onclick = closeLab;
    document.getElementById('runLabBtn').onclick = runLabCode;
    document.getElementById('resetLabBtn').onclick = () => {
        labOutput.textContent = '';
    };
    
    createUserBtn.onclick = createUser;
    switchUserBtn.onclick = switchUser;
    
    window.onclick = (event) => {
        if (event.target === labModal) closeLab();
    };
}

// Start
init();
