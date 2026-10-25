const addBtn        = document.getElementById('add-btn');
const taskList      = document.getElementById('task-list');
const addForm       = document.getElementById('add-task-form');
const taskTextInput = document.getElementById('new-task-text');
const deadlineInput = document.getElementById('new-task-deadline');
const dateHeader    = document.querySelector('.date-header span');

// ===== 1. ДАТА В ШАПКЕ =====
function setTodayDate() {
    const today = new Date();
    const options = { day: 'numeric', month: 'long' };
    dateHeader.textContent = today.toLocaleDateString('ru-RU', options);
}
setTodayDate();
setInterval(setTodayDate, 60 * 1000);

// ===== 2. МАСКА ДАТЫ =====
deadlineInput.addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) value = value.slice(0, 2) + '.' + value.slice(2);

    if (value.length >= 2) {
        let day = parseInt(value.slice(0, 2));
        if (day > 31) value = '31' + value.slice(2);
        if (day === 0) value = '01' + value.slice(2);
    }
    if (value.length >= 5) {
        let month = parseInt(value.slice(3, 5));
        if (month > 12) value = value.slice(0, 3) + '12';
        if (month === 0) value = value.slice(0, 3) + '01';
    }
    e.target.value = value;
});

// ===== 3. ПОКАЗ/СКРЫТИЕ ФОРМЫ =====
addBtn.addEventListener('click', function () {
    addForm.classList.toggle('active');
    if (addForm.classList.contains('active')) taskTextInput.focus();
});

// ===== 4. ХРАНИЛИЩЕ =====
const STORAGE_KEY = 'your-planner-tasks-v1';

function loadTasks() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ===== 5. СОЗДАНИЕ ЭЛЕМЕНТА ЗАДАЧИ =====
function createTaskElement(task) {
    const el = document.createElement('div');
    el.classList.add('task-item');
    if (task.done) el.classList.add('completed');

    el.dataset.deadline = task.deadline || '';
    el.dataset.id = task.id;

    el.innerHTML = `
        <div class="checkbox"></div>
        <span class="task-text">${escapeHtml(task.text)}</span>
        ${task.deadline ? `<span class="deadline">⟨${task.deadline}⟩</span>` : ''}
        <button class="delete-btn" title="Удалить" aria-label="Удалить">✕</button>
    `;

    el.addEventListener('click', function (e) {
        if (e.target.classList.contains('delete-btn')) return; // не переключать при удалении
        toggleTask(task.id);
    });

    el.querySelector('.delete-btn').addEventListener('click', function (e) {
        e.stopPropagation();
        deleteTask(task.id);
    });

    return el;
}

function escapeHtml(str) {
    return str.replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}

// ===== 6. РЕНДЕР + СОРТИРОВКА =====
function render() {
    const tasks = loadTasks();

    const counter = document.getElementById('tasks-counter');
    if (counter) {
        const left = tasks.filter(t => !t.done).length;
        counter.textContent = tasks.length
            ? `Осталось: ${left} из ${tasks.length}`
            : '';
    }

    tasks.sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        const ad = a.deadline || '99.99';
        const bd = b.deadline || '99.99';
        return ad.localeCompare(bd);
    });

    taskList.innerHTML = '';
    tasks.forEach(t => taskList.appendChild(createTaskElement(t)));
}

// ===== 7. ДОБАВЛЕНИЕ =====
function addTask() {
    const text = taskTextInput.value.trim();
    const deadline = deadlineInput.value.trim();
    if (!text) return;

    const tasks = loadTasks();
    tasks.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        text,
        deadline,
        done: false
    });
    saveTasks(tasks);

    taskTextInput.value = '';
    deadlineInput.value = '';
    addForm.classList.remove('active');
    render();
}

// ===== 8. ПЕРЕКЛЮЧЕНИЕ / УДАЛЕНИЕ =====
function toggleTask(id) {
    const tasks = loadTasks();
    const t = tasks.find(x => x.id === id);
    if (t) { t.done = !t.done; saveTasks(tasks); render(); }
}

function deleteTask(id) {
    saveTasks(loadTasks().filter(x => x.id !== id));
    render();
}

// ===== 9. ENTER =====
taskTextInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') deadlineInput.focus();
});
deadlineInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') addTask();
});

document.getElementById('clear-btn').addEventListener('click', () => {
    if (confirm('Удалить все задачи?')) {
        saveTasks([]);
        render();
    }
});

// ===== 10. СТАРТ =====
render();