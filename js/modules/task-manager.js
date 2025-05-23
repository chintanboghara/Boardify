import DragDropManager from './drag-drop-manager.js';

import { defaultTasks } from './constants'; // Import defaultTasks

/**
 * Manages tasks for the Boardify application including creation, updating,
 * deletion, searching, rendering, and sorting of tasks.
 */
class TaskManager {
  constructor(userId) { // Accept userId
    this.userId = userId;
    this.tasksKey = this.userId ? `tasks_${this.userId}` : 'tasks_guest'; // tasks_guest for null userId

    // Load tasks from localStorage or initialize with an empty array.
    this.tasks = JSON.parse(localStorage.getItem(this.tasksKey)) || [];
    this.filteredTasks = [...this.tasks];
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
    }
  }

  /**
   * Saves tasks to localStorage using the user-specific key and re-renders all tasks, then applies styling.
   */
  saveTasks() {
    localStorage.setItem(this.tasksKey, JSON.stringify(this.tasks));
    this.renderAllTasks();
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
    };
    this.tasks.push(newTask);
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
      this.tasks[taskIndex] = {
        ...this.tasks[taskIndex],
        title,
        description,
        priority,
        dueDate,
        assignee,
      };
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
      this.tasks.splice(taskIndex, 1);
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
    const boardManager = window.boardManager; // Access boardManager globally for column titles

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
    taskElement.innerHTML = `
      <div class="flex justify-between items-start mb-3">
        <h4 class="font-medium text-gray-900 dark:text-white text-lg">${task.title}</h4>
        <span class="priority-badge flex items-center justify-center text-sm px-3 py-1 rounded-md ${priorityClass}" data-priority="${task.priority}">
          ${task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Low'}
        </span>
      </div>
      <p class="text-gray-600 dark:text-gray-400 text-sm break-words line-clamp-3 mb-4">
        ${task.description || 'No description'}
      </p>
      ${task.dueDate ? `<p class="text-sm ${isOverdue ? 'text-red-500 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}">Due: ${new Date(task.dueDate).toLocaleDateString()}</p>` : ''}
      ${task.assignee ? `<p class="text-gray-600 dark:text-gray-400 break-words line-clamp-3 text-sm">Assignee: ${task.assignee}</p>` : ''}
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
        const column = elemBelow?.closest('.task-list');
        if (column) {
          const taskId = taskElement.dataset.taskId;
          const taskIndex = this.tasks.findIndex(t => t.id === taskId);
          if (taskIndex !== -1) {
            const newColumnIndex = Number.parseInt(column.dataset.index, 10);
            if (this.tasks[taskIndex].column !== newColumnIndex) {
              this.tasks[taskIndex].column = newColumnIndex;
               // No need to manually move the element, renderAllTasks will handle it
              this.saveTasks(); // This will re-render all tasks
            } else {
              // If the column hasn't changed, just ensure it's in the right place
              column.appendChild(taskElement); // Or some other logic to ensure correct order
              dragDropManager.handleDragEnd(taskElement); // Still call dragEnd
            }
          } else {
             dragDropManager.handleDragEnd(taskElement); // Task not found, end drag
          }
        } else {
          // If not dropped on a valid column, end the drag operation
          dragDropManager.handleDragEnd(taskElement);
        }
        // dragDropManager.handleDragEnd(taskElement); // Moved this call to be more conditional
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
    
    this.saveTasks(); // This will re-render the tasks in sorted order.
  }
}

export default TaskManager;
