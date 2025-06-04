import DragDropManager from './drag-drop-manager.js';

import { defaultTasks } from './constants'; // Import defaultTasks

/**
 * Manages tasks for the Boardify application including creation, updating,
 * deletion, searching, rendering, and sorting of tasks.
 */
class TaskManager {
  constructor(userId, boardManager) { // Accept userId and boardManager
    this.userId = userId;
    this.boardManager = boardManager; // Store boardManager instance
    this.tasksKey = this.userId ? `tasks_${this.userId}` : 'tasks_guest'; // tasks_guest for null userId

    // Load tasks from localStorage or initialize with an empty array.
    this.tasks = JSON.parse(localStorage.getItem(this.tasksKey)) || [];
    // Migration for existing tasks that might not have subtasks array
    // Migration for existing tasks that might not have subtasks array
    this.tasks.forEach(task => {
      if (!Array.isArray(task.subtasks)) { // Check if it's not an array (covers undefined or wrong type)
        task.subtasks = [];
      }
      // Migration for activityLog
      if (!Array.isArray(task.activityLog)) {
        task.activityLog = [];
      }
      // Migration for attachments
      if (!Array.isArray(task.attachments)) {
        task.attachments = [];
      }
    });
    this.filteredTasks = [...this.tasks]; // Update filteredTasks accordingly
    this.editingTaskId = null;
    this.taskModal = null;
    this.taskForm = null;
    // Cache a single instance of DragDropManager for reuse.
    this.dragDropManager = null;
    this.uiManager = null; // Placeholder for UIManager instance
  }

  /**
   * Sets the UIManager instance.
   * @param {Object} uiManager - The UIManager instance.
   */
  setUIManager(uiManager) {
    this.uiManager = uiManager;
  }

  /**
   * Retrieves all tasks.
   * @returns {Array} List of tasks.
   */
  getTasks() {
    return this.tasks;
  }

  /**
   * Sets the list of tasks and updates the filtered copy.
   * @param {Array} tasks - New tasks array.
   */
  setTasks(tasks) {
    this.tasks = tasks;
    this.filteredTasks = [...tasks];
  }

  /**
   * Initializes default tasks for the current user if no tasks exist.
   * This should be called when a new user is registered or when a guest session starts
   * and no specific guest tasks are found.
   */
  initializeDefaultTasksForUser() {
    if (localStorage.getItem(this.tasksKey) === null) {
      // Only set default tasks if no tasks currently exist for this user/guest.
      this.tasks = JSON.parse(JSON.stringify(defaultTasks)); // Deep copy to avoid modifying original defaults
      // Ensure task columns are valid for default boards (0, 1, 2)
      this.tasks.forEach(task => {
        if (task.column === undefined || task.column < 0 || task.column > 2) {
          task.column = 0; // Assign to the first board if column is invalid
        }
      });
      this.saveTasks(); // Save these default tasks
       this.renderAllTasks(); // Explicitly render all tasks after defaults are set and saved
    } else if (this.tasks.length === 0 && (JSON.parse(localStorage.getItem(this.tasksKey)) || []).length === 0) {
      // If current tasks in memory are empty AND localStorage is empty (or contains empty array string)
      // This can happen if user clears all tasks for all boards.
      // Consider if default tasks should be re-added here or if an empty state is preferred.
      // For now, let's re-add default tasks if everything is empty.
      // This behavior might need adjustment based on desired UX.
      this.tasks = JSON.parse(JSON.stringify(defaultTasks));
      this.tasks.forEach(task => {
        if (task.column === undefined || task.column < 0 || task.column > 2) {
          task.column = 0;
        }
      });
      this.saveTasks();
       this.renderAllTasks(); // Explicitly render all tasks
    }
  }

  /**
   * Saves tasks to localStorage using the user-specific key and applies styling.
   * Note: This method no longer calls renderAllTasks(). Rendering should be handled
   * by the calling method if a full re-render is needed, or preferably, specific DOM
   * updates should be made by the calling method.
   */
  saveTasks() {
    localStorage.setItem(this.tasksKey, JSON.stringify(this.tasks));
    // this.renderAllTasks(); // Removed: Callers should handle specific DOM updates or full renders.
    if (this.uiManager && typeof this.uiManager.applyTaskStyling === 'function') {
      this.uiManager.applyTaskStyling();
    }
  }

  /**
   * Opens the task modal for creating or editing a task.
   * @param {number} index - The board column index for the task.
   * @param {Object|null} [task=null] - The task to edit; if null, a new task is created.
   */
  openTaskModal(index, task = null) {
    this.taskModal = document.getElementById('task-modal');
    this.taskForm = document.getElementById('task-form');

    if (!this.taskModal || !this.taskForm) {
      console.error('Task modal or form not found in the DOM.');
      return;
    }

    this.taskModal.classList.remove('hidden');
    this.taskModal.classList.add('flex');
    this.taskForm.dataset.targetColumn = index;

    if (task) {
      // Populate form fields with task data for editing.
      this.editingTaskId = task.id;
      document.getElementById('task-title').value = task.title;
      document.getElementById('task-description').value = task.description || '';
      document.getElementById('task-priority').value = task.priority;
      document.getElementById('task-due-date').value = task.dueDate || '';
      document.getElementById('task-assignee').value = task.assignee || '';
      this.taskModal.querySelector('h3').textContent = 'Edit Task';
    } else {
      // Reset the form for new task creation.
      this.editingTaskId = null;
      this.taskForm.reset();
      this.taskModal.querySelector('h3').textContent = 'Add New Task';
      // Clear subtask list for new tasks
      const subtaskListElement = document.getElementById('subtask-list');
      if (subtaskListElement) {
        subtaskListElement.innerHTML = '';
      }
    }

    // Render subtasks if editing an existing task
    if (task && task.id) {
      this._renderSubtasks(task.id);
    }

    // Event Listeners for Subtasks
    // Ensure to remove existing listeners before adding new ones to prevent duplication
    // if openTaskModal can be called multiple times for the same modal instance.
    // However, since the modal is likely recreated or listeners are specific to its content,
    // this might be simpler. For robustness, manage listeners carefully.

    const addSubtaskBtn = document.getElementById('add-subtask-btn');
    const newSubtaskTitleInput = document.getElementById('new-subtask-title');
    const subtaskListElement = document.getElementById('subtask-list');

    // Handler for adding a subtask
    // Store handlers to remove them later if necessary, or use .onclick for simplicity if only one handler.
    // Using a named function allows for easier removal if openTaskModal is called multiple times.
    const handleAddSubtask = () => {
      const title = newSubtaskTitleInput.value.trim();
      if (!title) {
        alert('Subtask title cannot be empty.');
        return;
      }
      if (!this.editingTaskId) {
        alert('Please save the main task before adding subtasks.');
        return;
      }
      this.addSubtask(this.editingTaskId, title);
      this._renderSubtasks(this.editingTaskId);
      newSubtaskTitleInput.value = '';
    };

    // Remove previous listener before adding a new one to avoid duplicates
    if (addSubtaskBtn._clickHandler) {
      addSubtaskBtn.removeEventListener('click', addSubtaskBtn._clickHandler);
    }
    addSubtaskBtn._clickHandler = handleAddSubtask; // Store reference for potential removal
    addSubtaskBtn.addEventListener('click', handleAddSubtask);


    // Handler for subtask list interactions (toggle, delete)
    const handleSubtaskListClick = (event) => {
      if (!this.editingTaskId) return;

      const target = event.target;
      const subtaskLi = target.closest('li');
      if (!subtaskLi || !subtaskLi.dataset.subtaskId) return;
      
      const subtaskId = subtaskLi.dataset.subtaskId;

      if (target.classList.contains('subtask-checkbox')) {
        this.toggleSubtaskCompletion(this.editingTaskId, subtaskId);
        this._renderSubtasks(this.editingTaskId);
      } else if (target.closest('.subtask-delete-btn')) {
        this.deleteSubtask(this.editingTaskId, subtaskId);
        this._renderSubtasks(this.editingTaskId);
      }
    };
    
    if (subtaskListElement._clickHandler) {
        subtaskListElement.removeEventListener('click', subtaskListElement._clickHandler);
    }
    subtaskListElement._clickHandler = handleSubtaskListClick;
    subtaskListElement.addEventListener('click', handleSubtaskListClick);

    // Render Activity Log if editing an existing task
    if (task && task.id) {
      this._renderActivityLog(task.id);
    } else {
      // Clear activity log list for new tasks
      const activityLogListElement = document.getElementById('activity-log-list');
      if (activityLogListElement) {
        activityLogListElement.innerHTML = '';
      }
    }
  }
  
  /**
   * Private helper method to render subtasks in the modal.
   * @param {string} parentTaskId - The ID of the parent task.
   */
  _renderSubtasks(parentTaskId) {
    const parentTask = this.tasks.find(t => t.id === parentTaskId);
    const subtaskListElement = document.getElementById('subtask-list');

    if (!parentTask || !subtaskListElement) {
      if (subtaskListElement) subtaskListElement.innerHTML = ''; // Clear if no parent task but list exists
      return;
    }

    subtaskListElement.innerHTML = ''; // Clear existing subtasks

    if (parentTask.subtasks && parentTask.subtasks.length > 0) {
      parentTask.subtasks.forEach(subtask => {
        const li = document.createElement('li');
        li.className = `flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-md`;
        li.dataset.subtaskId = subtask.id; // Set data-subtask-id on the li

        li.innerHTML = `
          <div class="flex items-center">
            <input type="checkbox" class="subtask-checkbox form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 dark:border-gray-500 dark:bg-gray-600 focus:ring-indigo-500 dark:focus:ring-indigo-400" ${subtask.completed ? 'checked' : ''}>
            <span class="ml-2 text-sm text-gray-800 dark:text-gray-200 ${subtask.completed ? 'line-through' : ''}">${subtask.title}</span>
          </div>
          <button type="button" class="subtask-delete-btn text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500">
            <i class="fas fa-trash-alt text-xs"></i>
          </button>
        `;
        // The checkbox and delete button don't strictly need individual data-subtask-id if we use closest('li').dataset.subtaskId
        subtaskListElement.appendChild(li);
      });
    }
  }

  /**
   * Hides the task modal.
   */
  hideTaskModal() {
    this.taskModal = document.getElementById('task-modal');
    if (this.taskModal) {
      this.taskModal.classList.add('hidden');
      this.taskModal.classList.remove('flex');
    }
  }

  /**
   * Handles the submission of the task form by either adding a new task or updating an existing one.
   */
  handleTaskFormSubmit() {
    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const priority = document.getElementById('task-priority').value;
    const dueDate = document.getElementById('task-due-date').value;
    const assignee = document.getElementById('task-assignee').value.trim();
    const columnIndex = Number.parseInt(this.taskForm.dataset.targetColumn, 10);

    if (!title) {
      alert('Task title cannot be empty.');
      return;
    }

    if (this.editingTaskId) {
      this.updateTask(this.editingTaskId, title, description, priority, dueDate, assignee);
    } else {
      this.addTask(title, description, priority, dueDate, assignee, columnIndex);
    }

    this.hideTaskModal();
  }

  /**
   * Adds a new task.
   * @param {string} title - Task title.
   * @param {string} description - Task description.
   * @param {string} priority - Task priority.
   * @param {string} dueDate - Task due date.
   * @param {string} assignee - Task assignee.
   * @param {number} columnIndex - Board column index.
   */
  addTask(title, description, priority, dueDate, assignee, columnIndex) {
    const newTask = {
      id: Date.now().toString(),
      title,
      description,
      priority,
      dueDate,
      assignee,
      column: columnIndex,
      subtasks: [],
      activityLog: [],
      attachments: [] // Add this line
    };
    this.tasks.push(newTask);
    this._logActivity(newTask.id, 'TASK_CREATED', 'Task was created.');

    // Render the new task directly to the DOM
    const taskLists = document.querySelectorAll('.task-list');
    if (columnIndex >= 0 && columnIndex < taskLists.length) {
      const targetColumnElement = taskLists[columnIndex];
      this.renderTask(newTask, targetColumnElement);
    } else {
      console.warn(`Attempted to add task to an invalid column index: ${columnIndex}. Task data saved, but not rendered to a specific column.`);
      // Fallback: a full re-render might be needed if task isn't in a visible column,
      // or handle this case based on application logic. For now, just saving.
    }
    this.saveTasks();
  }

  /**
   * Updates an existing task.
   * @param {string} taskId - ID of the task to update.
   * @param {string} title - New title.
   * @param {string} description - New description.
   * @param {string} priority - New priority.
   * @param {string} dueDate - New due date.
   * @param {string} assignee - New assignee.
   */
  updateTask(taskId, title, description, priority, dueDate, assignee) {
    const taskIndex = this.tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      const originalTask = JSON.parse(JSON.stringify(this.tasks[taskIndex]));
      this.tasks[taskIndex] = {
        ...this.tasks[taskIndex],
        title,
        description,
        priority,
        dueDate,
        assignee,
      };

      if (originalTask.title !== this.tasks[taskIndex].title) {
        this._logActivity(taskId, 'FIELD_UPDATED', `Title changed from "${originalTask.title}" to "${this.tasks[taskIndex].title}".`);
      }
      if (originalTask.description !== this.tasks[taskIndex].description) {
        this._logActivity(taskId, 'FIELD_UPDATED', `Description updated.`);
      }
      if (originalTask.priority !== this.tasks[taskIndex].priority) {
        this._logActivity(taskId, 'FIELD_UPDATED', `Priority changed from "${originalTask.priority}" to "${this.tasks[taskIndex].priority}".`);
      }
      if (originalTask.dueDate !== this.tasks[taskIndex].dueDate) {
        this._logActivity(taskId, 'FIELD_UPDATED', `Due date changed from "${originalTask.dueDate || 'none'}" to "${this.tasks[taskIndex].dueDate || 'none'}".`);
      }
      if (originalTask.assignee !== this.tasks[taskIndex].assignee) {
        this._logActivity(taskId, 'FIELD_UPDATED', `Assignee changed from "${originalTask.assignee || 'none'}" to "${this.tasks[taskIndex].assignee || 'none'}".`);
      }

      // Update the specific task in the DOM
      const taskElement = document.getElementById(`task-${taskId}`);
      if (taskElement && taskElement.parentElement) {
        const parentColumn = taskElement.parentElement;
        taskElement.remove();
        this.renderTask(this.tasks[taskIndex], parentColumn);
      } else {
        // If element not found, a full re-render might be needed as a fallback.
        // For now, we'll rely on saveTasks possibly triggering global styling,
        // but ideally, the element should always be found if the task exists.
        console.warn(`Task element task-${taskId} not found for DOM update. A full re-render might be needed if UI becomes inconsistent.`);
        // Consider calling this.renderAllTasks() here if critical, but trying to avoid.
      }
      this.saveTasks();
    }
  }

  /**
   * Deletes a task after confirmation.
   * @param {string} taskId - ID of the task to delete.
   */
  deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    const taskIndex = this.tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      // Log activity before splicing, so task data is available if needed for log details
      // Example: this._logActivity(taskId, 'TASK_DELETED', `Task "${this.tasks[taskIndex].title}" was deleted.`);
      // For now, no specific log detail is captured that needs the task data before splice.

      this.tasks.splice(taskIndex, 1);

      // Remove the task element from the DOM
      const taskElement = document.getElementById(`task-${taskId}`);
      if (taskElement) {
        taskElement.remove();
      } else {
        console.warn(`Task element task-${taskId} not found for DOM removal. A full re-render might be needed if UI becomes inconsistent.`);
      }
      this.saveTasks();
    }
  }

  /**
   * Filters tasks based on a search term and renders the filtered list.
   * @param {string} searchTerm - Term used to filter tasks.
   */
  searchTasks(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredTasks = [...this.tasks];
    } else {
      searchTerm = searchTerm.toLowerCase().trim();
      this.filteredTasks = this.tasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm)
      );
    }
    this.renderFilteredTasks();
  }

  /**
   * Renders filtered tasks in their respective board columns.
   */
  renderFilteredTasks() {
    const taskLists = document.querySelectorAll('.task-list');
    taskLists.forEach(list => (list.innerHTML = ''));
    this.filteredTasks.forEach(task => {
      const columnIndex = task.column;
      if (columnIndex >= 0 && columnIndex < taskLists.length) {
        this.renderTask(task, taskLists[columnIndex]);
      }
    });
    if (this.uiManager && typeof this.uiManager.applyTaskStyling === 'function') {
      this.uiManager.applyTaskStyling();
    }
  }

  /**
   * Renders all tasks.
   */
  renderAllTasks() {
    this.filteredTasks = [...this.tasks];
    const taskLists = document.querySelectorAll('.task-list');
    taskLists.forEach(list => (list.innerHTML = ''));
    this.tasks.forEach(task => {
      const columnIndex = task.column;
      if (columnIndex >= 0 && columnIndex < taskLists.length) {
        this.renderTask(task, taskLists[columnIndex]);
      }
    });
    if (this.uiManager && typeof this.uiManager.applyTaskStyling === 'function') {
      this.uiManager.applyTaskStyling();
    }
  }

  /**
   * Returns the CSS class for a task based on its priority.
   * @param {string} priority - Task priority.
   * @returns {string} CSS class for styling.
   */
  getPriorityClass(priority) {
    switch (priority) {
      case 'high':
        return 'bg-rose-300 dark:bg-rose-500 text-gray-800 dark:text-white';
      case 'medium':
        return 'bg-amber-300 dark:bg-amber-500 text-gray-800 dark:text-white';
      default:
        return 'bg-green-300 dark:bg-green-500 text-gray-800 dark:text-white';
    }
  }

  /**
   * Renders a single task element in the target column.
   * @param {Object} task - Task object.
   * @param {HTMLElement} targetColumn - The container element for the task.
   */
  renderTask(task, targetColumn) {
    const taskElement = document.createElement('div');
    taskElement.className =
      'task bg-white dark:bg-[#151A1C] rounded-md shadow-lg p-4 mt-1 flex flex-col hover:shadow-xl transition-shadow relative';
    taskElement.id = `task-${task.id}`;
    taskElement.dataset.taskId = task.id;
    taskElement.draggable = true;

    // Due date styling
    let isOverdue = false; // This will determine the text color of the due date
    const boardManager = this.boardManager; // Access boardManager via instance property

    // Remove any existing due date styling classes first to handle updates correctly
    taskElement.classList.remove(
      'overdue-task', 
      'due-today', 
      'due-soon', 
      'border-red-500', 
      'border-blue-500', 
      'border-yellow-500',
      'border-2' // Remove border-2 as well, it will be re-added if needed
    );

    if (task.dueDate && boardManager) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize today's date

      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0); // Normalize due date

      const timeDiff = dueDate.getTime() - today.getTime();
      const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      const board = boardManager.boards[task.column];
      const isDoneColumn = board && board.title.toLowerCase().includes('done');

      if (!isDoneColumn) {
        if (dayDiff < 0) { // Overdue
          taskElement.classList.add('overdue-task', 'border-2', 'border-red-500');
          isOverdue = true;
        } else if (dayDiff === 0) { // Due today
          taskElement.classList.add('due-today', 'border-2', 'border-blue-500');
          isOverdue = false; 
        } else if (dayDiff > 0 && dayDiff <= 3) { // Due soon
          taskElement.classList.add('due-soon', 'border-2', 'border-yellow-500');
          isOverdue = false;
        } else {
          // Not overdue, not due today, not due soon (or no specific state)
          isOverdue = false;
          // No border classes needed here as they were cleared
        }
      } else {
        // Task is in a "Done" column, not considered for these visual cues
        isOverdue = false;
      }
    } else {
      // No due date or boardManager not available
      isOverdue = false;
    }

    const priorityClass = this.getPriorityClass(task.priority);

    // Calculate Subtask Statistics & Generate Display HTML
    let subtaskDisplayHtml = '';
    if (task.subtasks && task.subtasks.length > 0) {
      const totalSubtasks = task.subtasks.length;
      const completedSubtasks = task.subtasks.filter(st => st.completed).length;
      const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
      subtaskDisplayHtml = `
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-1">Subtasks: ${completedSubtasks} / ${totalSubtasks}</p>
        <div class="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 mb-2">
          <div class="bg-indigo-600 h-1.5 rounded-full" style="width: ${progressPercentage}%"></div>
        </div>
      `;
    }

    taskElement.innerHTML = `
      <div class="flex justify-between items-start mb-3">
        <h4 class="font-medium text-gray-900 dark:text-white text-lg">${task.title}</h4>
        <span class="priority-badge flex items-center justify-center text-sm px-3 py-1 rounded-md ${priorityClass}" data-priority="${task.priority}">
          ${task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Low'}
        </span>
      </div>
      <div class="prose prose-sm dark:prose-invert text-gray-600 dark:text-gray-400 break-words line-clamp-3 mb-4">
        ${task.description ? marked.parse(task.description) : '<p class="text-gray-500 italic">No description</p>'}
      </div>
      ${subtaskDisplayHtml}
      ${task.dueDate ? `<p class="text-sm ${isOverdue ? 'text-red-500 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'} mt-1">Due: ${new Date(task.dueDate).toLocaleDateString()}</p>` : ''}
      ${task.assignee ? `<p class="text-gray-600 dark:text-gray-400 break-words line-clamp-3 text-sm mt-1">Assignee: ${task.assignee}</p>` : ''}
      <div class="flex justify-end space-x-2 mt-auto pt-2">
        <button class="edit-task-btn p-2 text-gray-700 rounded-md transition-all hover:bg-white/20 dark:text-gray-300" data-task-id="${task.id}">
          <i class="fas fa-pencil-alt text-sm"></i>
        </button>
        <button class="delete-task-btn p-2 text-gray-700 rounded-md transition-all hover:bg-white/20 dark:text-gray-300" data-task-id="${task.id}">
          <i class="fas fa-trash text-sm"></i>
        </button>
      </div>
    `;
    targetColumn.appendChild(taskElement);

    // Initialize or reuse the DragDropManager instance.
    // Ensure this.dragDropManager is initialized before calling methods on it.
    if (!this.dragDropManager) {
        this.dragDropManager = new DragDropManager(this);
    }
    const dragDropManager = this.dragDropManager;


    // Attach drag and touch event listeners.
    taskElement.addEventListener('dragstart', e => {
      dragDropManager.handleDragStart(e, taskElement);
    });

    taskElement.addEventListener('touchstart', e => {
      const touchStartY = e.touches[0].clientY;
      const touchStartX = e.touches[0].clientX;
      // Set a timeout to distinguish between a scroll and a drag start
      const touchStartTimeout = setTimeout(() => {
        // Check if the touch has moved significantly, if not, treat as drag start
        if (
          taskElement.parentElement && // Ensure the element is still in the DOM
          Math.abs(e.touches[0].clientY - touchStartY) < 10 &&
          Math.abs(e.touches[0].clientX - touchStartX) < 10
        ) {
          dragDropManager.handleDragStart(e, taskElement);
        }
      }, 200); // 200ms delay, adjust as needed

      // Clear timeout if touch ends or moves significantly before timeout
      taskElement.addEventListener('touchend', () => clearTimeout(touchStartTimeout), { once: true });
      taskElement.addEventListener('touchmove', (moveEvent) => {
        if (Math.abs(moveEvent.touches[0].clientY - touchStartY) > 10 || Math.abs(moveEvent.touches[0].clientX - touchStartX) > 10) {
          clearTimeout(touchStartTimeout);
        }
      }, { once: true });
    });


    taskElement.addEventListener('touchmove', e => {
      if (taskElement.classList.contains('dragging')) {
        e.preventDefault(); // Prevent scrolling while dragging
        dragDropManager.handleTouchMove(e, taskElement);
      }
    });

    taskElement.addEventListener('touchend', e => {
      if (taskElement.classList.contains('dragging')) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        const newColumnElement = elemBelow?.closest('.task-list');
        const taskId = taskElement.dataset.taskId;

        const originalTaskIndexInArray = this.tasks.findIndex(t => t.id === taskId);

        if (originalTaskIndexInArray === -1) {
            dragDropManager.handleDragEnd(taskElement);
            console.warn(`Task with ID ${taskId} not found in data array during touchend.`);
            return;
        }
        const taskToMove = this.tasks[originalTaskIndexInArray];

        if (newColumnElement) {
            const oldColumnIndex = taskToMove.column;
            const newColumnIndex = Number.parseInt(newColumnElement.dataset.index, 10);

            // DOM Manipulation: Move taskElement to its new visual position
            if (oldColumnIndex !== newColumnIndex) {
                newColumnElement.appendChild(taskElement);
            } else {
                const placeholder = newColumnElement.querySelector('.task-placeholder');
                if (placeholder) {
                    newColumnElement.insertBefore(taskElement, placeholder);
                } else {
                    newColumnElement.appendChild(taskElement); // Fallback
                }
            }
            if (newColumnElement.querySelector('.task-placeholder')) {
              newColumnElement.querySelector('.task-placeholder').remove();
            }


            // Data Update
            taskToMove.column = newColumnIndex; // Update column first

            // Remove from old position in data array
            this.tasks.splice(originalTaskIndexInArray, 1);

            // Get new DOM order in the target column
            const tasksInNewColumnDomOrder = Array.from(newColumnElement.querySelectorAll('.task:not(.task-placeholder)'))
                                              .map(el => el.dataset.taskId);

            let insertIndex = -1;
            const positionInDomColumn = tasksInNewColumnDomOrder.indexOf(taskId);

            if (positionInDomColumn === -1) {
                // Should not happen if taskElement was just added to newColumnElement
                console.error('Error: Dragged task not found in its new DOM column after move.');
                // Fallback: add to end of current tasks for this column, or just end of array
                this.tasks.push(taskToMove); // Simplistic fallback
            } else if (tasksInNewColumnDomOrder.length === 1) {
                // Task is the only one in its new DOM column. Find where this column's tasks should start.
                let targetIdx = 0;
                for (let i = 0; i < this.tasks.length; i++) {
                    if (this.tasks[i].column >= newColumnIndex) {
                        targetIdx = i;
                        break;
                    }
                    targetIdx = i + 1;
                }
                insertIndex = targetIdx;
            } else if (positionInDomColumn === tasksInNewColumnDomOrder.length - 1) {
                // Task is the last in its new DOM column.
                // Find the index of the last task in `this.tasks` (that's not taskToMove) belonging to newColumnIndex.
                let lastIndexOfSameColumn = -1;
                for (let i = this.tasks.length - 1; i >= 0; i--) {
                    if (this.tasks[i].column === newColumnIndex) {
                        lastIndexOfSameColumn = i;
                        break;
                    }
                }
                if (lastIndexOfSameColumn !== -1) {
                    insertIndex = lastIndexOfSameColumn + 1;
                } else {
                    // If no other tasks in this column, find where this column's tasks should start
                    let targetIdx = 0;
                    for (let i = 0; i < this.tasks.length; i++) {
                        if (this.tasks[i].column >= newColumnIndex) {
                            targetIdx = i;
                            break;
                        }
                        targetIdx = i + 1;
                    }
                    insertIndex = targetIdx;
                }
            } else {
                // Task is in the middle. Find the task that comes after it in the DOM.
                const nextTaskInDomId = tasksInNewColumnDomOrder[positionInDomColumn + 1];
                const nextTaskInArrayIndex = this.tasks.findIndex(t => t.id === nextTaskInDomId);
                if (nextTaskInArrayIndex !== -1) {
                    insertIndex = nextTaskInArrayIndex;
                } else {
                     // Fallback if next task in DOM not found in current data array (should be rare)
                    console.warn(`Next task ID ${nextTaskInDomId} not found in data array. Appending dragged task.`);
                    insertIndex = this.tasks.length;
                }
            }

            if (insertIndex === -1) { // Final fallback if something went wrong
                insertIndex = this.tasks.length;
            }
            this.tasks.splice(insertIndex, 0, taskToMove);
            this.saveTasks();
        }
        dragDropManager.handleDragEnd(taskElement);
      }
    });

    taskElement.addEventListener('dragend', () => {
      // Note: dragDropManager.handleDragEnd(taskElement) is called inside touchend for touch,
      // and should also be called here for mouse drag events.
      // However, if saveTasks() which calls renderAllTasks() is used,
      // the element might be removed and re-created.
      // Ensure handleDragEnd can gracefully handle if taskElement is no longer in DOM or changed.
      dragDropManager.handleDragEnd(taskElement);
    });

    // Attach event listeners for editing and deleting the task.
    taskElement.querySelector('.edit-task-btn').addEventListener('click', () => {
      this.openTaskModal(task.column, task);
    });

    taskElement.querySelector('.delete-task-btn').addEventListener('click', () => {
      this.deleteTask(task.id);
    });
  }

  /**
   * Sorts tasks within a specific board column by the given criteria.
   * @param {number} boardIndex - Index of the board column.
   * @param {string} sortBy - Field to sort by ('priority', 'dueDate', 'title').
   * @param {string} direction - Sort direction ('asc' or 'desc').
   */
  sortTasks(boardIndex, sortBy, direction) {
    // Make sure boardManager is available if needed for sorting logic that depends on board properties
    // const boardManager = window.boardManager; 

    const boardTasks = this.tasks.filter(task => task.column === boardIndex);
    boardTasks.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'priority') {
        const priorityValues = { high: 3, medium: 2, low: 1 }; // Higher value means higher priority
        const priorityA = priorityValues[a.priority.toLowerCase()] || 0;
        const priorityB = priorityValues[b.priority.toLowerCase()] || 0;
        comparison = priorityA - priorityB;
      } else if (sortBy === 'dueDate') {
        const dateA = a.dueDate ? new Date(a.dueDate) : null;
        const dateB = b.dueDate ? new Date(b.dueDate) : null;

        if (!dateA && !dateB) comparison = 0;
        else if (!dateA) comparison = 1; // Tasks without due dates go to the end
        else if (!b.dueDate) comparison = -1; // Tasks without due dates go to the end
        else comparison = dateA - dateB;
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      }
      return direction === 'desc' ? -comparison : comparison;
    });
    
    // Replace existing tasks for the current board with the sorted ones
    const otherBoardTasks = this.tasks.filter(task => task.column !== boardIndex);
    this.tasks = [...otherBoardTasks, ...boardTasks];
    // Ensure tasks maintain their original column index after sorting
    // This is implicitly handled by filtering and spreading, but good to be mindful of.
    
    this.saveTasks();
    this.renderAllTasks(); // Explicitly re-render all tasks to reflect sorting in the UI.
  }

  /**
   * Adds a subtask to a parent task.
   * @param {string} parentTaskId - The ID of the parent task.
   * @param {string} subtaskTitle - The title of the new subtask.
   */
  addSubtask(parentTaskId, subtaskTitle) {
    const parentTask = this.tasks.find(task => task.id === parentTaskId);
    if (!parentTask) {
      console.error(`Parent task with ID ${parentTaskId} not found.`);
      return;
    }

    // Ensure subtasks array exists (should be guaranteed by constructor/addTask)
    if (!Array.isArray(parentTask.subtasks)) {
      parentTask.subtasks = [];
    }

    const newSubtask = {
      id: `sub_${Date.now().toString()}`,
      title: subtaskTitle,
      completed: false,
    };
    parentTask.subtasks.push(newSubtask);
    this._logActivity(parentTaskId, 'SUBTASK_ACTIVITY', `Subtask "${newSubtask.title}" added.`);

    // Re-render the parent task card to reflect subtask changes
    const taskElement = document.getElementById(`task-${parentTaskId}`);
    if (taskElement && taskElement.parentElement) {
      const parentColumn = taskElement.parentElement;
      taskElement.remove();
      this.renderTask(parentTask, parentColumn);
    } else {
      console.warn(`Parent task element task-${parentTaskId} not found for DOM update after subtask change.`);
    }
    this.saveTasks();
  }

  /**
   * Edits the title of an existing subtask.
   * @param {string} parentTaskId - The ID of the parent task.
   * @param {string} subtaskId - The ID of the subtask to edit.
   * @param {string} newTitle - The new title for the subtask.
   */
  editSubtask(parentTaskId, subtaskId, newTitle) {
    const parentTask = this.tasks.find(task => task.id === parentTaskId);
    if (!parentTask) {
      console.error(`Parent task with ID ${parentTaskId} not found.`);
      return;
    }

    const subtask = parentTask.subtasks.find(sub => sub.id === subtaskId);
    if (!subtask) {
      console.error(`Subtask with ID ${subtaskId} not found in parent task ${parentTaskId}.`);
      return;
    }

    const originalSubtaskTitle = subtask.title;
    subtask.title = newTitle;
    this._logActivity(parentTaskId, 'SUBTASK_ACTIVITY', `Subtask "${originalSubtaskTitle}" title changed to "${newTitle}".`);

    // Re-render the parent task card
    const taskElement = document.getElementById(`task-${parentTaskId}`);
    if (taskElement && taskElement.parentElement) {
      const parentColumn = taskElement.parentElement;
      taskElement.remove();
      this.renderTask(parentTask, parentColumn);
    } else {
      console.warn(`Parent task element task-${parentTaskId} not found for DOM update after subtask change.`);
    }
    this.saveTasks();
  }

  /**
   * Toggles the completion status of a subtask.
   * @param {string} parentTaskId - The ID of the parent task.
   * @param {string} subtaskId - The ID of the subtask to toggle.
   */
  toggleSubtaskCompletion(parentTaskId, subtaskId) {
    const parentTask = this.tasks.find(task => task.id === parentTaskId);
    if (!parentTask) {
      console.error(`Parent task with ID ${parentTaskId} not found.`);
      return;
    }

    const subtask = parentTask.subtasks.find(sub => sub.id === subtaskId);
    if (!subtask) {
      console.error(`Subtask with ID ${subtaskId} not found in parent task ${parentTaskId}.`);
      return;
    }

    subtask.completed = !subtask.completed;
    this._logActivity(parentTaskId, 'SUBTASK_ACTIVITY', `Subtask "${subtask.title}" marked as ${subtask.completed ? 'complete' : 'incomplete'}.`);

    // Re-render the parent task card
    const taskElement = document.getElementById(`task-${parentTaskId}`);
    if (taskElement && taskElement.parentElement) {
      const parentColumn = taskElement.parentElement;
      taskElement.remove();
      this.renderTask(parentTask, parentColumn);
    } else {
      console.warn(`Parent task element task-${parentTaskId} not found for DOM update after subtask change.`);
    }
    this.saveTasks();
  }

  /**
   * Deletes a subtask from a parent task.
   * @param {string} parentTaskId - The ID of the parent task.
   * @param {string} subtaskId - The ID of the subtask to delete.
   */
  deleteSubtask(parentTaskId, subtaskId) {
    const parentTask = this.tasks.find(task => task.id === parentTaskId);
    if (!parentTask) {
      console.error(`Parent task with ID ${parentTaskId} not found.`);
      return;
    }

    const subtaskToDelete = parentTask.subtasks.find(sub => sub.id === subtaskId);
    parentTask.subtasks = parentTask.subtasks.filter(sub => sub.id !== subtaskId);
    if (subtaskToDelete) {
      this._logActivity(parentTaskId, 'SUBTASK_ACTIVITY', `Subtask "${subtaskToDelete.title}" deleted.`);
    }

    // Re-render the parent task card
    const taskElement = document.getElementById(`task-${parentTaskId}`);
    if (taskElement && taskElement.parentElement) {
      const parentColumn = taskElement.parentElement;
      taskElement.remove();
      this.renderTask(parentTask, parentColumn);
    } else {
      console.warn(`Parent task element task-${parentTaskId} not found for DOM update after subtask change.`);
    }
    this.saveTasks();
  }

  /**
   * Private helper method to log an activity for a task.
   * @param {string} taskId - The ID of the task.
   * @param {string} activityType - The type of activity (e.g., 'TASK_CREATED', 'TITLE_UPDATED').
   * @param {string} detailsString - A string describing the activity.
   */
  _logActivity(taskId, activityType, detailsString) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) {
      console.error(`Task not found for logging activity: ${taskId}`);
      return;
    }
    // Ensure activityLog array exists (should be guaranteed by constructor/addTask)
    if (!Array.isArray(task.activityLog)) {
      console.error(`activityLog array missing for task: ${taskId}. Initializing.`);
      task.activityLog = [];
    }
    const logEntry = {
      id: `log_${Date.now().toString()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      type: activityType,
      details: detailsString
    };
    task.activityLog.unshift(logEntry);
    // No this.saveTasks() here, as the calling method will handle it.
  }

  /**
   * Private helper method to render the activity log in the modal.
   * @param {string} parentTaskId - The ID of the parent task.
   */
  _renderActivityLog(parentTaskId) {
    const parentTask = this.tasks.find(t => t.id === parentTaskId);
    const activityLogListElement = document.getElementById('activity-log-list');

    if (!activityLogListElement) {
      console.error('Activity log list element not found.');
      return;
    }

    activityLogListElement.innerHTML = ''; // Clear existing logs

    if (parentTask && parentTask.activityLog && parentTask.activityLog.length > 0) {
      parentTask.activityLog.forEach(logEntry => {
        const li = document.createElement('li');
        li.className = 'text-xs text-gray-600 dark:text-gray-400 py-1';
        
        const timestamp = new Date(logEntry.timestamp);
        const formattedTimestamp = `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`;

        li.innerHTML = `
          <span class="font-semibold text-gray-700 dark:text-gray-300">${formattedTimestamp}:</span> ${logEntry.details}
          <!-- <span class="text-gray-500 dark:text-gray-500">(${logEntry.type})</span> -->
        `;
        activityLogListElement.appendChild(li);
      });
    } else if (parentTask) { // Task exists but no logs
      const li = document.createElement('li');
      li.className = 'text-xs text-gray-500 dark:text-gray-400 py-1 italic';
      li.textContent = 'No activity yet for this task.';
      activityLogListElement.appendChild(li);
    }
    // If no parentTask, list remains empty which is fine.
  }

  /**
   * Formats file size in bytes to a human-readable string.
   * @param {number} bytes - The file size in bytes.
   * @returns {string} Human-readable file size.
   */
  _formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Private helper method to render attachments in the modal.
   * @param {string} parentTaskId - The ID of the parent task.
   */
  _renderAttachments(parentTaskId) {
    const parentTask = this.tasks.find(t => t.id === parentTaskId);
    const attachmentListElement = document.getElementById('attachment-list');

    if (!attachmentListElement) {
      console.error('Attachment list element (#attachment-list) not found.');
      return;
    }

    attachmentListElement.innerHTML = ''; // Clear existing attachments

    if (parentTask && parentTask.attachments && parentTask.attachments.length > 0) {
      parentTask.attachments.forEach(attachment => {
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between p-1.5 bg-gray-100 dark:bg-gray-700 rounded-md text-xs mb-2'; // Added mb-2 for spacing
        li.dataset.attachmentId = attachment.id;

        let fileDisplayContainer = document.createElement('div');
        fileDisplayContainer.className = 'flex items-center flex-grow truncate mr-2'; // Added mr-2 for spacing before download/delete

        // Image Thumbnail
        if (attachment.fileDataURL && attachment.fileType && attachment.fileType.startsWith('image/')) {
          const img = document.createElement('img');
          img.src = attachment.fileDataURL;
          img.alt = attachment.fileName;
          img.className = 'max-w-[80px] max-h-14 object-cover mr-2 rounded-sm'; // Tailwind classes for thumbnail
          fileDisplayContainer.appendChild(img);
        }

        // Filename
        const fileNameSpan = document.createElement('span');
        fileNameSpan.className = 'font-medium text-gray-800 dark:text-gray-200 break-all';
        fileNameSpan.textContent = attachment.fileName;
        fileDisplayContainer.appendChild(fileNameSpan);

        // File Type and Size (optional, can be added if needed, kept simple for now)
        const fileMetaSpan = document.createElement('span');
        fileMetaSpan.className = 'text-gray-500 dark:text-gray-400 ml-2 text-xs';
        fileMetaSpan.textContent = `(${attachment.fileType || 'unknown type'}, ${this._formatFileSize(attachment.fileSize || 0)})`;
        fileDisplayContainer.appendChild(fileMetaSpan);

        li.appendChild(fileDisplayContainer);

        // Controls Container (Download and Delete)
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'flex items-center flex-shrink-0';

        // Download Link
        if (attachment.fileDataURL) {
          const downloadLink = document.createElement('a');
          downloadLink.href = attachment.fileDataURL;
          downloadLink.download = attachment.fileName;
          downloadLink.innerHTML = '<i class="fas fa-download text-xs"></i>'; // Using FontAwesome icon
          downloadLink.className = 'text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-500 mr-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600';
          downloadLink.title = `Download ${attachment.fileName}`; // Tooltip
          controlsContainer.appendChild(downloadLink);
        }

        // Delete Button
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'attachment-delete-btn text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600';
        deleteButton.innerHTML = '<i class="fas fa-trash-alt text-xs"></i>';
        deleteButton.title = `Delete ${attachment.fileName}`; // Tooltip
        // The event listener for delete will be handled by the modal setup (event delegation on #attachment-list)
        controlsContainer.appendChild(deleteButton);

        li.appendChild(controlsContainer);
        attachmentListElement.appendChild(li);
      });
    } else if (parentTask) {
      const li = document.createElement('li');
      li.className = 'text-xs text-gray-500 dark:text-gray-400 py-1 italic';
      li.textContent = 'No files attached.';
      attachmentListElement.appendChild(li);
    }
  }

  /**
   * Adds a file attachment to a task.
   * @param {string} taskId - The ID of the task.
   * @param {File} file - The File object to attach.
   */
  addAttachment(taskId, file) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) {
      console.error(`Task not found for adding attachment: ${taskId}`);
      return;
    }

    // Define maximum file size (1MB in bytes)
    const MAX_FILE_SIZE = 1 * 1024 * 1024;

    // Check if file size exceeds the maximum
    if (file.size > MAX_FILE_SIZE) {
      alert(`File "${file.name}" exceeds the maximum allowed size of 1MB. It will not be attached.`);
      return;
    }

    if (!Array.isArray(task.attachments)) {
      // This should ideally not happen due to constructor migration
      console.error(`Attachments array missing for task: ${taskId}. Initializing.`);
      task.attachments = [];
    }

    const fileReader = new FileReader();

    fileReader.onload = (event) => {
      const attachment = {
        id: `att_${Date.now().toString()}_${Math.random().toString(36).substring(2, 7)}`,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        attachedAt: new Date().toISOString(),
        fileDataURL: event.target.result // Store the Data URL
      };

      task.attachments.push(attachment);
      this._logActivity(taskId, 'ATTACHMENT_ADDED', `File "${attachment.fileName}" attached.`);
      this.saveTasks(); // Ensure this is called *after* fileDataURL is available
    };

    fileReader.onerror = (error) => {
      console.error(`Error reading file "${file.name}":`, error);
      alert(`Error reading file "${file.name}". It could not be attached.`);
    };

    fileReader.readAsDataURL(file); // Start reading the file
  }

  /**
   * Deletes a file attachment from a task.
   * @param {string} taskId - The ID of the task.
   * @param {string} attachmentId - The ID of the attachment to delete.
   */
  deleteAttachment(taskId, attachmentId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) {
      console.error(`Task not found for deleting attachment: ${taskId}`);
      return;
    }

    if (!Array.isArray(task.attachments)) {
      console.error(`Attachments array missing or not an array for task: ${taskId}.`);
      return;
    }

    const attachmentIndex = task.attachments.findIndex(att => att.id === attachmentId);
    if (attachmentIndex === -1) {
      console.error(`Attachment with ID ${attachmentId} not found in task ${taskId}.`);
      return;
    }

    const deletedAttachment = task.attachments[attachmentIndex]; // Get ref before splice
    task.attachments.splice(attachmentIndex, 1);

    this._logActivity(taskId, 'ATTACHMENT_REMOVED', `File "${deletedAttachment.fileName}" removed.`);
    this.saveTasks();
  }
}

export default TaskManager;
