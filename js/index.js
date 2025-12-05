// State
let lessons = [];
let users = {}; // { "username": { score: 0, completedSteps: [], completedLessons: [] } }
let currentUser = null; // "username"
let currentLesson = null;
let currentStepIndex = 0;
let currentQuizPassed = false;
let lessonCache = {}; // Cache for lesson details (steps)

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

// Menu Elements
const menuToggle = document.getElementById('menuToggle');
const menuClose = document.getElementById('menuClose');
const sidebar = document.getElementById('sidebar');

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
    
    // Find current lesson index
    let currentIndex = 0;
    if (currentLesson) {
        currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
    } else {
        // If no current lesson loaded yet, find first incomplete
        currentIndex = lessons.findIndex(l => !completedLessons.has(l.id));
        if (currentIndex === -1) currentIndex = lessons.length - 1; // All done
    }

    lessons.forEach((lesson, index) => {
        // Filter logic: Show Completed, Current, and Next (Disabled)
        if (index > currentIndex + 1) return;

        const li = document.createElement('li');
        li.className = 'lesson-item';
        li.dataset.id = lesson.id;
        
        const isCompleted = completedLessons.has(lesson.id);
        const isCurrent = index === currentIndex;
        const isNext = index === currentIndex + 1;
        
        if (isNext) {
            // Only disable if the current lesson is NOT complete
            if (!completedLessons.has(lessons[currentIndex].id)) {
                li.classList.add('disabled');
            }
        }
        if (isCurrent) {
            li.classList.add('active');
            li.classList.add('expanded'); // Auto-expand current
        }

        const tick = isCompleted ? '<span class="tick-icon completed" style="font-size: 1em;">✔</span>' : '';
        
        // Progress bar for the lesson tile
        let progressPercent = isCompleted ? 100 : 0;
        if (isCurrent && currentLesson) {
             let completedCount = 0;
             const completedSteps = getCompletedSteps();
            for (let i = 0; i < currentLesson.steps.length; i++) {
                if (completedSteps.has(`${currentLesson.id}-${i}`)) {
                    completedCount++;
                }
            }
            progressPercent = (completedCount / currentLesson.steps.length) * 100;
        }

        li.innerHTML = `
            <div class="lesson-header" onclick="toggleLessonAccordion('${lesson.id}')">
                <div style="flex: 1;">
                    <div class="lesson-title">${tick} ${lesson.title}</div>
                    <div class="lesson-meta">
                        <span>${lesson.duration}</span>
                        <span>${lesson.difficulty}</span>
                    </div>
                    <div class="lesson-progress-track">
                        <div class="lesson-progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
            </div>
            <ul class="lesson-steps" id="steps-${lesson.id}">
                <!-- Steps loaded on demand -->
            </ul>
        `;
        
        lessonList.appendChild(li);

        // If current or expanded, load steps immediately
        if (isCurrent && currentLesson) {
            renderLessonSteps(lesson.id, currentLesson.steps);
        }
    });
}

async function toggleLessonAccordion(lessonId) {
    const li = document.querySelector(`.lesson-item[data-id="${lessonId}"]`);
    if (!li || li.classList.contains('disabled')) return;

    const wasExpanded = li.classList.contains('expanded');
    
    if (wasExpanded) {
        li.classList.remove('expanded');
    } else {
        li.classList.add('expanded');
        
        // Load steps if not present
        const stepsContainer = document.getElementById(`steps-${lessonId}`);
        if (stepsContainer.children.length === 0) {
            stepsContainer.innerHTML = '<li class="step-item">Loading steps...</li>';
            
            // Check cache or fetch
            let steps = [];
            if (currentLesson && currentLesson.id === lessonId) {
                steps = currentLesson.steps;
            } else if (lessonCache[lessonId]) {
                steps = lessonCache[lessonId];
            } else {
                // Fetch
                const lessonMeta = lessons.find(l => l.id === lessonId);
                if (lessonMeta) {
                    try {
                        const res = await fetch(`steps/${lessonMeta.file}`);
                        const data = await res.json();
                        steps = data.steps;
                        lessonCache[lessonId] = steps;
                    } catch (e) {
                        stepsContainer.innerHTML = '<li class="step-item error">Failed to load steps</li>';
                        return;
                    }
                }
            }
            renderLessonSteps(lessonId, steps);
        }
    }
}

function renderLessonSteps(lessonId, steps) {
    const container = document.getElementById(`steps-${lessonId}`);
    if (!container) return;
    
    container.innerHTML = '';
    const completedSteps = getCompletedSteps();
    const isCurrentLesson = currentLesson && currentLesson.id === lessonId;
    const isCompletedLesson = getCompletedLessons().has(lessonId);

    steps.forEach((step, index) => {
        const stepKey = `${lessonId}-${index}`;
        const isStepCompleted = completedSteps.has(stepKey);
        
        const li = document.createElement('li');
        li.className = 'step-item';
        if (isStepCompleted) li.classList.add('completed-step');
        
        // Clickable logic
        let clickable = false;
        if (isCompletedLesson) {
            clickable = true;
        } else if (isCurrentLesson) {
            // Clickable if previous step is completed (or it's step 0)
            const prevStepKey = `${lessonId}-${index - 1}`;
            const prevCompleted = index === 0 || completedSteps.has(prevStepKey);
            
            if (isStepCompleted || prevCompleted) {
                clickable = true;
            }
        }

        if (!clickable) {
            li.classList.add('disabled');
        }

        if (isCurrentLesson && index === currentStepIndex) {
            li.classList.add('active');
        }

        li.innerHTML = `
            <span>${index + 1}. ${step.title}</span>
            <span class="step-tick">✔</span>
        `;
        
        if (clickable) {
            li.onclick = (e) => {
                e.stopPropagation(); // Prevent accordion toggle
                if (isCurrentLesson) {
                    loadStep(index);
                    if (window.innerWidth <= 768) sidebar.classList.remove('open');
                } else {
                    loadLesson(lessonId, index);
                    if (window.innerWidth <= 768) sidebar.classList.remove('open');
                }
            };
        }
        
        container.appendChild(li);
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

    // Quiz Rendering
    currentQuizPassed = false;
    if (step.quiz) {
        renderQuiz(step.quiz);
        // Check if already completed
        const key = `${currentLesson.id}-${currentStepIndex}`;
        if (getCompletedSteps().has(key)) {
            currentQuizPassed = true;
            showQuizSuccess(true); // Show passed state without alert
        }
    }

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
function loadStep(index) {
    if (!currentLesson || index < 0 || index >= currentLesson.steps.length) return;
    currentStepIndex = index;
    renderStep();
    savePosition(currentLesson.id, currentStepIndex);
    renderSidebar();
}

function nextStep() {
    if (!currentLesson) return;
    
    // Quiz Check
    const step = currentLesson.steps[currentStepIndex];
    if (step.quiz && !currentQuizPassed) {
        alert("Please complete the quiz correctly to continue!");
        return;
    }

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
        renderSidebar();
    } else {
        // Lesson Complete
        checkLessonCompletion();
        saveUsers();
        renderSidebar();
        updateOverallProgress();
        alert(`Lesson Complete! 🎉 +${POINTS_PER_LESSON} XP`);

        // Navigate to next lesson
        const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
        if (currentIndex !== -1 && currentIndex < lessons.length - 1) {
            const nextLesson = lessons[currentIndex + 1];
            loadLesson(nextLesson.id, 0);
        }
    }
}

function prevStep() {
    if (currentStepIndex > 0) {
        currentStepIndex--;
        renderStep();
        savePosition(currentLesson.id, currentStepIndex);
        renderSidebar();
    }
}

// Quiz Logic
function renderQuiz(quizData) {
    const quizContainer = document.createElement('div');
    quizContainer.className = 'quiz-container';
    quizContainer.style.marginTop = '20px';
    quizContainer.style.padding = '20px';
    quizContainer.style.background = 'rgba(0,0,0,0.2)';
    quizContainer.style.borderRadius = '8px';
    quizContainer.style.border = '1px solid #444';

    let html = '<h3 style="color: #667eea; margin-bottom: 15px;">📝 Knowledge Check</h3>';
    
    quizData.forEach((q, qIndex) => {
        html += `
            <div class="quiz-question" style="margin-bottom: 20px;">
                <p style="font-weight: bold; margin-bottom: 10px;">${qIndex + 1}. ${q.question}</p>
                <div class="quiz-options">
        `;
        
        q.options.forEach((opt, oIndex) => {
            html += `
                <label style="display: block; margin: 5px 0; cursor: pointer;">
                    <input type="radio" name="q${qIndex}" value="${oIndex}"> 
                    ${opt}
                </label>
            `;
        });
        
        html += `</div></div>`;
    });

    html += `<button id="checkQuizBtn" style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Check Answers</button>`;
    html += `<div id="quizResult" style="margin-top: 10px; font-weight: bold;"></div>`;

    quizContainer.innerHTML = html;
    stepContent.appendChild(quizContainer);

    document.getElementById('checkQuizBtn').onclick = () => checkQuiz(quizData);
}

function checkQuiz(quizData) {
    let allCorrect = true;
    const resultDiv = document.getElementById('quizResult');
    
    quizData.forEach((q, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        const questionDiv = document.querySelectorAll('.quiz-question')[index];
        
        if (!selected || parseInt(selected.value) !== q.correct) {
            allCorrect = false;
            questionDiv.style.borderLeft = '3px solid #ff6b6b';
            questionDiv.style.paddingLeft = '10px';
        } else {
            questionDiv.style.borderLeft = '3px solid #00ff00';
            questionDiv.style.paddingLeft = '10px';
        }
    });

    if (allCorrect) {
        currentQuizPassed = true;
        resultDiv.textContent = '✨ All correct! You can proceed.';
        resultDiv.style.color = '#00ff00';
        document.getElementById('checkQuizBtn').style.display = 'none';
        
        // Auto-complete the step
        const key = `${currentLesson.id}-${currentStepIndex}`;
        if (!getCompletedSteps().has(key)) {
            toggleStepCompletion();
        }
    } else {
        resultDiv.textContent = '❌ Some answers are incorrect. Please try again.';
        resultDiv.style.color = '#ff6b6b';
    }
}

function showQuizSuccess(alreadyPassed) {
    const btn = document.getElementById('checkQuizBtn');
    const result = document.getElementById('quizResult');
    if (btn) btn.style.display = 'none';
    if (result) {
        result.textContent = alreadyPassed ? '✅ Quiz completed' : '✨ All correct!';
        result.style.color = '#00ff00';
    }
    
    // Disable inputs
    document.querySelectorAll('.quiz-container input').forEach(input => input.disabled = true);
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
    
    // Menu Toggle
    if (menuToggle) {
        menuToggle.onclick = () => {
            sidebar.classList.add('open');
        };
    }
    
    if (menuClose) {
        menuClose.onclick = () => {
            sidebar.classList.remove('open');
        };
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            sidebar.classList.contains('open') && 
            !sidebar.contains(e.target) && 
            e.target !== menuToggle) {
            sidebar.classList.remove('open');
        }
    });
    
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
