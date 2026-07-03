// ===========================
// STATE MANAGEMENT
// ===========================
const state = {
    userName: localStorage.getItem('userName') || 'Friend',
    theme: localStorage.getItem('theme') || 'light',
    todos: JSON.parse(localStorage.getItem('todos')) || [],
    links: JSON.parse(localStorage.getItem('links')) || [],
    pomodoroMinutes: parseInt(localStorage.getItem('pomodoroMinutes')) || 25,
    timerRunning: false,
    timerPaused: false,
    timerSeconds: 0,
    timerInterval: null,
    sortMode: 'default'
};

// ===========================
// INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Apply saved theme
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeIcon();
    
    // Initialize all components
    updateClock();
    updateGreeting();
    renderTodos();
    renderLinks();
    initializeTimer();
    
    // Set up event listeners
    setupEventListeners();
    
    // Start clock update interval
    setInterval(updateClock, 1000);
    setInterval(updateGreeting, 60000); // Update greeting every minute
}

function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Name editing
    document.getElementById('editNameBtn').addEventListener('click', openNameModal);
    document.getElementById('saveNameBtn').addEventListener('click', saveName);
    document.getElementById('cancelNameBtn').addEventListener('click', closeNameModal);
    document.getElementById('nameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveName();
    });
    
    // Timer controls
    document.getElementById('startBtn').addEventListener('click', startTimer);
    document.getElementById('pauseBtn').addEventListener('click', pauseTimer);
    document.getElementById('resetBtn').addEventListener('click', resetTimer);
    document.getElementById('setTimeBtn').addEventListener('click', setPomodoroTime);
    
    // Todo list
    document.getElementById('addTodoBtn').addEventListener('click', addTodo);
    document.getElementById('todoInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });
    document.getElementById('sortTasks').addEventListener('change', (e) => {
        state.sortMode = e.target.value;
        renderTodos();
    });
    
    // Quick links
    document.getElementById('addLinkBtn').addEventListener('click', addLink);
    document.getElementById('linkUrl').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addLink();
    });
    
    // Modal click outside to close
    document.getElementById('nameModal').addEventListener('click', (e) => {
        if (e.target.id === 'nameModal') closeNameModal();
    });
}

// ===========================
// CLOCK & GREETING
// ===========================
function updateClock() {
    const now = new Date();
    
    // Update time
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('time').textContent = `${hours}:${minutes}:${seconds}`;
    
    // Update date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('date').textContent = now.toLocaleDateString('en-US', options);
}

function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Good Evening';
    
    if (hour >= 5 && hour < 12) {
        greeting = 'Good Morning';
    } else if (hour >= 12 && hour < 18) {
        greeting = 'Good Afternoon';
    }
    
    document.getElementById('greeting').innerHTML = `${greeting}, <span id="userName">${state.userName}</span>!`;
}

// ===========================
// THEME MANAGEMENT
// ===========================
function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('theme', state.theme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = state.theme === 'light' ? '🌙' : '☀️';
    document.getElementById('themeToggle').textContent = icon;
}

// ===========================
// NAME MANAGEMENT
// ===========================
function openNameModal() {
    document.getElementById('nameModal').classList.add('active');
    document.getElementById('nameInput').value = state.userName;
    document.getElementById('nameInput').focus();
}

function closeNameModal() {
    document.getElementById('nameModal').classList.remove('active');
}

function saveName() {
    const newName = document.getElementById('nameInput').value.trim();
    if (newName) {
        state.userName = newName;
        localStorage.setItem('userName', newName);
        updateGreeting();
        closeNameModal();
    }
}

// ===========================
// FOCUS TIMER (POMODORO)
// ===========================
function initializeTimer() {
    state.timerSeconds = state.pomodoroMinutes * 60;
    updateTimerDisplay();
    document.getElementById('pomodoroTime').value = state.pomodoroMinutes;
}

function startTimer() {
    if (state.timerRunning && !state.timerPaused) return;
    
    state.timerRunning = true;
    state.timerPaused = false;
    
    state.timerInterval = setInterval(() => {
        if (state.timerSeconds > 0) {
            state.timerSeconds--;
            updateTimerDisplay();
        } else {
            // Timer completed
            resetTimer();
            playTimerSound();
            alert('Focus session complete! Great job! 🎉');
        }
    }, 1000);
}

function pauseTimer() {
    if (!state.timerRunning) return;
    
    state.timerPaused = true;
    clearInterval(state.timerInterval);
}

function resetTimer() {
    state.timerRunning = false;
    state.timerPaused = false;
    clearInterval(state.timerInterval);
    state.timerSeconds = state.pomodoroMinutes * 60;
    updateTimerDisplay();
}

function setPomodoroTime() {
    const newTime = parseInt(document.getElementById('pomodoroTime').value);
    if (newTime && newTime > 0 && newTime <= 60) {
        state.pomodoroMinutes = newTime;
        localStorage.setItem('pomodoroMinutes', newTime);
        resetTimer();
    } else {
        alert('Please enter a valid time between 1 and 60 minutes.');
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(state.timerSeconds / 60);
    const seconds = state.timerSeconds % 60;
    const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.getElementById('timerDisplay').textContent = display;
    
    // Update progress circle
    const totalSeconds = state.pomodoroMinutes * 60;
    const progress = (state.timerSeconds / totalSeconds) * 565.48;
    document.getElementById('timerProgress').style.strokeDashoffset = 565.48 - progress;
}

function playTimerSound() {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// ===========================
// TODO LIST MANAGEMENT
// ===========================
function addTodo() {
    const input = document.getElementById('todoInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    // Check for duplicate tasks
    const isDuplicate = state.todos.some(todo => 
        todo.text.toLowerCase() === text.toLowerCase()
    );
    
    if (isDuplicate) {
        alert('This task already exists!');
        return;
    }
    
    const todo = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    state.todos.push(todo);
    saveTodos();
    renderTodos();
    input.value = '';
}

function toggleTodo(id) {
    const todo = state.todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
    }
}

function deleteTodo(id) {
    state.todos = state.todos.filter(t => t.id !== id);
    saveTodos();
    renderTodos();
}

function editTodo(id) {
    const todo = state.todos.find(t => t.id === id);
    if (!todo) return;
    
    const newText = prompt('Edit task:', todo.text);
    if (newText && newText.trim()) {
        const trimmedText = newText.trim();
        
        // Check for duplicate (excluding current task)
        const isDuplicate = state.todos.some(t => 
            t.id !== id && t.text.toLowerCase() === trimmedText.toLowerCase()
        );
        
        if (isDuplicate) {
            alert('A task with this name already exists!');
            return;
        }
        
        todo.text = trimmedText;
        saveTodos();
        renderTodos();
    }
}

function sortTodos(todos) {
    const sorted = [...todos];
    
    switch (state.sortMode) {
        case 'alphabetical':
            sorted.sort((a, b) => a.text.localeCompare(b.text));
            break;
        case 'completed':
            sorted.sort((a, b) => {
                if (a.completed === b.completed) return 0;
                return a.completed ? 1 : -1;
            });
            break;
        default:
            // Keep original order (by creation time)
            break;
    }
    
    return sorted;
}

function renderTodos() {
    const todoList = document.getElementById('todoList');
    const sortedTodos = sortTodos(state.todos);
    
    todoList.innerHTML = '';
    
    sortedTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            <div class="todo-actions">
                <button class="todo-btn edit-btn" title="Edit">✏️</button>
                <button class="todo-btn delete-btn" title="Delete">🗑️</button>
            </div>
        `;
        
        // Event listeners
        li.querySelector('.todo-checkbox').addEventListener('change', () => toggleTodo(todo.id));
        li.querySelector('.edit-btn').addEventListener('click', () => editTodo(todo.id));
        li.querySelector('.delete-btn').addEventListener('click', () => deleteTodo(todo.id));
        
        todoList.appendChild(li);
    });
    
    updateTodoStats();
}

function updateTodoStats() {
    const total = state.todos.length;
    const completed = state.todos.filter(t => t.completed).length;
    const remaining = total - completed;
    
    let statsText = `${total} task${total !== 1 ? 's' : ''}`;
    if (total > 0) {
        statsText += ` • ${completed} completed • ${remaining} remaining`;
    }
    
    document.getElementById('todoStats').textContent = statsText;
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(state.todos));
}

// ===========================
// QUICK LINKS MANAGEMENT
// ===========================
function addLink() {
    const nameInput = document.getElementById('linkName');
    const urlInput = document.getElementById('linkUrl');
    
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    
    if (!name || !url) {
        alert('Please enter both name and URL');
        return;
    }
    
    // Validate URL
    if (!isValidUrl(url)) {
        alert('Please enter a valid URL (e.g., https://example.com)');
        return;
    }
    
    const link = {
        id: Date.now(),
        name: name,
        url: url
    };
    
    state.links.push(link);
    saveLinks();
    renderLinks();
    
    nameInput.value = '';
    urlInput.value = '';
}

function deleteLink(id) {
    if (confirm('Delete this link?')) {
        state.links = state.links.filter(l => l.id !== id);
        saveLinks();
        renderLinks();
    }
}

function renderLinks() {
    const linksGrid = document.getElementById('linksGrid');
    linksGrid.innerHTML = '';
    
    if (state.links.length === 0) {
        linksGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; grid-column: 1/-1;">No links yet. Add your favorite websites!</p>';
        return;
    }
    
    state.links.forEach(link => {
        const div = document.createElement('div');
        div.className = 'link-item';
        
        div.innerHTML = `
            <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
                ${escapeHtml(link.name)}
            </a>
            <button class="link-delete" title="Delete">×</button>
        `;
        
        div.querySelector('.link-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteLink(link.id);
        });
        
        linksGrid.appendChild(div);
    });
}

function saveLinks() {
    localStorage.setItem('links', JSON.stringify(state.links));
}

// ===========================
// UTILITY FUNCTIONS
// ===========================
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
