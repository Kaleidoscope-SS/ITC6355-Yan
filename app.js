/* ============================================================
   TASKBEHEER — Task Manager
   JavaScript | OOP | DOM Manipulation | Event Handling
   ============================================================ */

'use strict';

/* ============================================================
   CLASS: Task
   Represents a single task with all its properties.
   ============================================================ */
class Task {
  constructor({ title, description = '', priority = 'medium', category = 'Personal' }) {
    this.id          = Task.generateId();
    this.title       = title.trim();
    this.description = description.trim();
    this.priority    = priority;
    this.category    = category;
    this.completed   = false;
    this.createdAt   = new Date();
    this.updatedAt   = new Date();
  }

  /** Generate a unique ID using timestamp + random */
  static generateId() {
    return `task-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  /** Toggle completed state and update timestamp */
  toggleComplete() {
    this.completed = !this.completed;
    this.updatedAt = new Date();
    return this;
  }

  /** Update task fields */
  update({ title, description, priority, category }) {
    if (title !== undefined)       this.title       = title.trim();
    if (description !== undefined) this.description = description.trim();
    if (priority !== undefined)    this.priority    = priority;
    if (category !== undefined)    this.category    = category;
    this.updatedAt = new Date();
    return this;
  }

  /** Format created date for display */
  formattedDate() {
    return this.createdAt.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  }
}


/* ============================================================
   CLASS: TaskManager
   Manages the collection of tasks: CRUD, filter, sort, search.
   ============================================================ */
class TaskManager {
  constructor() {
    this._tasks = [];
  }

  /** Add a new Task; returns the new Task instance */
  addTask(data) {
    const task = new Task(data);
    this._tasks.push(task);
    return task;
  }

  /** Get task by ID */
  getTaskById(id) {
    return this._tasks.find(t => t.id === id) || null;
  }

  /** Update an existing task by ID */
  updateTask(id, data) {
    const task = this.getTaskById(id);
    if (!task) throw new Error(`Task ${id} not found.`);
    task.update(data);
    return task;
  }

  /** Delete task by ID; returns true if found and deleted */
  deleteTask(id) {
    const idx = this._tasks.findIndex(t => t.id === id);
    if (idx === -1) return false;
    this._tasks.splice(idx, 1);
    return true;
  }

  /** Toggle completed state of a task */
  toggleComplete(id) {
    const task = this.getTaskById(id);
    if (!task) throw new Error(`Task ${id} not found.`);
    task.toggleComplete();
    return task;
  }

  /** Return all tasks (shallow copy) */
  getAllTasks() {
    return [...this._tasks];
  }

  /**
   * Filter and sort tasks.
   * @param {Object} opts - { category, status, sortPriority, query }
   */
  getFilteredTasks({ category = 'all', status = 'all', sortPriority = 'none', query = '' } = {}) {
    const PRIORITY_ORDER = { high: 3, medium: 2, low: 1 };
    let tasks = this.getAllTasks();

    // Category filter
    if (category !== 'all') {
      tasks = tasks.filter(t => t.category === category);
    }

    // Status filter
    if (status === 'active')    tasks = tasks.filter(t => !t.completed);
    if (status === 'completed') tasks = tasks.filter(t =>  t.completed);

    // Search query
    if (query.trim() !== '') {
      const q = query.toLowerCase();
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }

    // Sort by priority
    if (sortPriority === 'asc') {
      tasks.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    } else if (sortPriority === 'desc') {
      tasks.sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]);
    }

    return tasks;
  }

  /** Return summary statistics */
  getStats() {
    const all = this._tasks;
    return {
      total:     all.length,
      active:    all.filter(t => !t.completed).length,
      completed: all.filter(t =>  t.completed).length,
      high:      all.filter(t => t.priority === 'high' && !t.completed).length
    };
  }
}


/* ============================================================
   CLASS: NotificationSystem
   Handles on-screen toast notifications.
   ============================================================ */
class NotificationSystem {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  /**
   * Show a notification.
   * @param {string} title   - Bold heading
   * @param {string} message - Sub-text
   * @param {string} icon    - Emoji icon
   * @param {number} duration- Duration in ms (default 4000)
   */
  show(title, message, icon = '🔔', duration = 4000) {
    const el = document.createElement('div');
    el.className = 'notification';
    el.innerHTML = `
      <span class="notification-icon">${icon}</span>
      <div class="notification-body">
        <div class="notification-title">${this._escape(title)}</div>
        <div class="notification-msg">${this._escape(message)}</div>
      </div>
    `;
    this.container.appendChild(el);

    // Auto-remove after duration
    const removeTimer = setTimeout(() => this._dismiss(el), duration);

    // Click to dismiss early
    el.addEventListener('click', () => {
      clearTimeout(removeTimer);
      this._dismiss(el);
    });
  }

  _dismiss(el) {
    el.classList.add('notif-fade');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
    // Fallback removal
    setTimeout(() => { if (el.parentNode) el.remove(); }, 600);
  }

  _escape(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
}


/* ============================================================
   CLASS: TaskUI
   Handles all DOM rendering and user interaction.
   ============================================================ */
class TaskUI {
  constructor() {
    this.manager      = new TaskManager();
    this.notifier     = new NotificationSystem('notification-container');
    this.editingId    = null;
    this.currentTheme = 'light';

    // Cache DOM references
    this.dom = {
      titleInput:     document.getElementById('task-title'),
      descInput:      document.getElementById('task-desc'),
      categorySelect: document.getElementById('task-category'),
      prioritySelect: document.getElementById('task-priority'),
      titleError:     document.getElementById('title-error'),
      saveBtn:        document.getElementById('save-btn'),
      saveBtnText:    document.getElementById('save-btn-text'),
      cancelBtn:      document.getElementById('cancel-edit-btn'),
      searchInput:    document.getElementById('search-input'),
      filterCategory: document.getElementById('filter-category'),
      sortPriority:   document.getElementById('sort-priority'),
      filterStatus:   document.getElementById('filter-status'),
      taskList:       document.getElementById('task-list'),
      emptyState:     document.getElementById('empty-state'),
      taskCountLabel: document.getElementById('task-count-label'),
      themeToggle:    document.getElementById('theme-toggle'),
      themeIcon:      document.getElementById('theme-icon'),
      themeLabel:     document.getElementById('theme-label'),
      statTotal:      document.getElementById('stat-total'),
      statActive:     document.getElementById('stat-active'),
      statDone:       document.getElementById('stat-done'),
      statHigh:       document.getElementById('stat-high'),
    };

    this._bindEvents();
    this._render();
    this._seedSampleTasks();
  }

  /* ------ Seed a few sample tasks for demonstration ------ */
  _seedSampleTasks() {
    const samples = [
      { title: 'Review project brief',    description: 'Go through the full requirements document before the team meeting.', priority: 'high',   category: 'Work'     },
      { title: 'Buy groceries',           description: 'Milk, bread, eggs, and fresh vegetables for the week.',               priority: 'low',    category: 'Personal' },
      { title: 'Fix login page bug',      description: 'Users report the password field loses focus on mobile Safari.',       priority: 'high',   category: 'Urgent'   },
      { title: 'Schedule dentist',        description: '',                                                                     priority: 'medium', category: 'Personal' },
      { title: 'Prepare Q3 report',       description: 'Compile sales data and write executive summary for stakeholders.',    priority: 'medium', category: 'Work'     },
    ];
    samples.forEach(s => this.manager.addTask(s));
    this._render();
  }

  /* ------ Bind all event listeners ------ */
  _bindEvents() {
    const d = this.dom;

    // Form save
    d.saveBtn.addEventListener('click', () => this._handleSave());

    // Cancel edit
    d.cancelBtn.addEventListener('click', () => this._cancelEdit());

    // Live validation on title
    d.titleInput.addEventListener('input', () => {
      if (d.titleInput.value.trim().length > 0) {
        d.titleError.textContent = '';
      }
    });

    // Enter key in title input
    d.titleInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); this._handleSave(); }
    });

    // Filter/sort/search — re-render on any change
    [d.searchInput, d.filterCategory, d.sortPriority, d.filterStatus].forEach(el => {
      el.addEventListener('input', () => this._render());
    });

    // Theme toggle
    d.themeToggle.addEventListener('click', () => this._toggleTheme());

    // Delegate task-list actions (edit, delete, complete)
    d.taskList.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id     = btn.closest('[data-id]').dataset.id;
      const action = btn.dataset.action;
      if (action === 'edit')     this._startEdit(id);
      if (action === 'delete')   this._deleteTask(id);
      if (action === 'complete') this._toggleComplete(id);
    });
  }

  /* ------ Validate form inputs ------ */
  _validate() {
    const title = this.dom.titleInput.value.trim();
    if (!title) {
      this.dom.titleError.textContent = 'Task title is required.';
      this.dom.titleInput.focus();
      return false;
    }
    if (title.length < 2) {
      this.dom.titleError.textContent = 'Title must be at least 2 characters.';
      this.dom.titleInput.focus();
      return false;
    }
    this.dom.titleError.textContent = '';
    return true;
  }

  /* ------ Handle Add / Update save ------ */
  _handleSave() {
    if (!this._validate()) return;

    const data = {
      title:       this.dom.titleInput.value.trim(),
      description: this.dom.descInput.value.trim(),
      priority:    this.dom.prioritySelect.value,
      category:    this.dom.categorySelect.value,
    };

    if (this.editingId) {
      // Update existing task
      const task = this.manager.updateTask(this.editingId, data);
      if (task.priority === 'high') {
        this.notifier.show(
          'High-Priority Task Updated',
          `"${task.title}" has been updated.`,
          '⚠️'
        );
      } else {
        this.notifier.show('Task Updated', `"${task.title}" was saved.`, '✏️', 3000);
      }
      this._cancelEdit();
    } else {
      // Add new task
      const task = this.manager.addTask(data);
      if (task.priority === 'high') {
        this.notifier.show(
          'High-Priority Task Added!',
          `"${task.title}" has been added to your list.`,
          '🔴'
        );
      }
      this._clearForm();
    }

    this._render();
  }

  /* ------ Start editing a task ------ */
  _startEdit(id) {
    const task = this.manager.getTaskById(id);
    if (!task) return;

    this.editingId = id;

    this.dom.titleInput.value     = task.title;
    this.dom.descInput.value      = task.description;
    this.dom.prioritySelect.value = task.priority;
    this.dom.categorySelect.value = task.category;

    this.dom.saveBtnText.textContent = 'Save Changes';
    this.dom.cancelBtn.classList.remove('hidden');
    this.dom.titleInput.focus();

    // Highlight editing card
    document.querySelectorAll('.task-card').forEach(c => c.classList.remove('editing'));
    const card = document.querySelector(`.task-card[data-id="${id}"]`);
    if (card) {
      card.classList.add('editing');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Scroll form into view on mobile
    this.dom.titleInput.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ------ Cancel editing ------ */
  _cancelEdit() {
    this.editingId = null;
    this._clearForm();
    this.dom.saveBtnText.textContent = 'Add Task';
    this.dom.cancelBtn.classList.add('hidden');
    document.querySelectorAll('.task-card').forEach(c => c.classList.remove('editing'));
  }

  /* ------ Clear form fields ------ */
  _clearForm() {
    this.dom.titleInput.value     = '';
    this.dom.descInput.value      = '';
    this.dom.prioritySelect.value = 'medium';
    this.dom.categorySelect.value = 'Personal';
    this.dom.titleError.textContent = '';
  }

  /* ------ Delete a task ------ */
  _deleteTask(id) {
    const task = this.manager.getTaskById(id);
    if (!task) return;
    const title = task.title;

    // Animate out
    const card = document.querySelector(`.task-card[data-id="${id}"]`);
    if (card) {
      card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      card.style.opacity    = '0';
      card.style.transform  = 'translateX(-20px)';
      setTimeout(() => {
        this.manager.deleteTask(id);
        if (this.editingId === id) this._cancelEdit();
        this._render();
      }, 260);
    } else {
      this.manager.deleteTask(id);
      this._render();
    }

    this.notifier.show('Task Deleted', `"${title}" has been removed.`, '🗑️', 3000);
  }

  /* ------ Toggle task completion ------ */
  _toggleComplete(id) {
    const task = this.manager.toggleComplete(id);

    if (task.completed) {
      this.notifier.show(
        task.priority === 'high' ? 'High-Priority Task Completed! 🎉' : 'Task Completed',
        `"${task.title}" marked as done.`,
        task.priority === 'high' ? '🏆' : '✅',
        task.priority === 'high' ? 5000 : 3000
      );
    }

    this._render();
  }

  /* ------ Toggle dark/light theme ------ */
  _toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this.currentTheme === 'dark' ? 'dark' : '');
    this.dom.themeIcon.textContent  = this.currentTheme === 'dark' ? '☀️' : '🌙';
    this.dom.themeLabel.textContent = this.currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
  }

  /* ------ Build filter parameters from current UI state ------ */
  _getFilterParams() {
    return {
      category:      this.dom.filterCategory.value,
      status:        this.dom.filterStatus.value,
      sortPriority:  this.dom.sortPriority.value,
      query:         this.dom.searchInput.value,
    };
  }

  /* ------ Render task list + stats ------ */
  _render() {
    const params = this._getFilterParams();
    const tasks  = this.manager.getFilteredTasks(params);
    const stats  = this.manager.getStats();

    // Update stats
    this.dom.statTotal.textContent = stats.total;
    this.dom.statActive.textContent = stats.active;
    this.dom.statDone.textContent   = stats.completed;
    this.dom.statHigh.textContent   = stats.high;

    // Update count label
    const catLabel = params.category === 'all' ? 'All Tasks' : params.category + ' Tasks';
    const queryTag = params.query ? ` — "${params.query}"` : '';
    this.dom.taskCountLabel.textContent = `${catLabel}${queryTag} (${tasks.length})`;

    // Clear list
    this.dom.taskList.innerHTML = '';

    if (tasks.length === 0) {
      this.dom.emptyState.classList.remove('hidden');
      const sub = this.dom.emptyState.querySelector('#empty-sub');
      if (params.query || params.category !== 'all' || params.status !== 'all') {
        sub.textContent = 'Try adjusting your filters or search query.';
      } else {
        sub.textContent = 'Add your first task to get started.';
      }
      return;
    }

    this.dom.emptyState.classList.add('hidden');

    // Render each task card
    tasks.forEach(task => {
      const card = this._buildCard(task);
      this.dom.taskList.appendChild(card);
    });
  }

  /* ------ Build a single task card DOM element ------ */
  _buildCard(task) {
    const card = document.createElement('article');
    card.className = `task-card${task.completed ? ' completed' : ''}`;
    card.dataset.id       = task.id;
    card.dataset.priority = task.priority;

    const priorityLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    const descHtml = task.description
      ? `<p class="task-description">${this._escapeHtml(task.description)}</p>`
      : '';

    card.innerHTML = `
      <div class="task-card-title-row">
        <span class="task-title">${this._escapeHtml(task.title)}</span>
        <span class="badge badge-priority-${task.priority}">${priorityLabel}</span>
        <span class="badge badge-category">${this._escapeHtml(task.category)}</span>
        ${task.completed ? '<span class="badge badge-done">Done</span>' : ''}
      </div>
      <div class="task-card-actions">
        <button class="btn-icon btn-done"   data-action="complete" title="${task.completed ? 'Mark active' : 'Mark complete'}">
          ${task.completed ? '↩' : '✓'}
        </button>
        <button class="btn-icon btn-edit"   data-action="edit"    title="Edit task">✎</button>
        <button class="btn-icon btn-delete" data-action="delete"  title="Delete task">✕</button>
      </div>
      ${descHtml}
      <div class="task-meta">Added ${task.formattedDate()}</div>
    `;

    return card;
  }

  /* ------ Escape HTML to prevent XSS ------ */
  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}


/* ============================================================
   INIT — Boot the application on DOMContentLoaded
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  new TaskUI();
});
