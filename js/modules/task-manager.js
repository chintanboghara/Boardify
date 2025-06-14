import DragDropManager from './drag-drop-manager.js';
import { TaskCard } from '../components/TaskCard.js';
import { defaultTasks } from './constants.js';
import { useTaskStore } from '../store/taskStore.js';

/**
 * Manages tasks for the Boardify application including creation, updating,
 * deletion, searching, rendering, and sorting of tasks.
 */
class TaskManager {
  constructor(userId, boardManager) {
    this.userId = userId;
    this.boardManager = boardManager;

    useTaskStore.getState().loadTasksForUser(this.userId);

    // this.filteredTasks is used by renderFilteredTasks. It will be populated by searchTasks or renderAllTasks.
    // Initialize it to an empty array or based on initial store state if needed immediately.
    // For now, renderAllTasks/searchTasks will set it before rendering.
    this.filteredTasks = [];
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
    return useTaskStore.getState().tasks; // Reads directly from the store
  }

  /**
   * Sets all tasks in the store. Used for operations like data import.
   * @param {Array} tasksArray - The new array of tasks.
   */
  setTasks(tasksArray) {
    useTaskStore.getState().setAllTasks(tasksArray);
    // Rendering methods like renderAllTasks will now pull from the store
    // and rebuild filteredTasks as needed.
  }

  /**
   * Initializes default tasks for the current user if no tasks exist.
   * This should be called when a new user is registered or when a guest session starts
   * and no specific guest tasks are found.
   */
  initializeDefaultTasksForUser() {
    const storeState = useTaskStore.getState();
    // loadTasksForUser has already been called in constructor, setting currentUserId
    if (storeState.currentUserId === this.userId && storeState.tasks.length > 0) {
      // Tasks already exist for this user in the store, do nothing.
      // We might still want to render them if this is part of an initial setup.
      // this.renderAllTasks(); // Potentially call if UI isn't subscribed yet
      return;
    }

    const tasksToSet = JSON.parse(JSON.stringify(defaultTasks));
    tasksToSet.forEach(task => {
        if (task.column === undefined || task.column < 0 || task.column > 2) {
            task.column = 0;
        }
    });
    storeState.setAllTasks(tasksToSet); // This handles migration and saving to LS
    this.renderAllTasks(); // Render the newly set default tasks
  }

  // saveTasks() method is removed. Persistence is handled by the store.

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

    const archiveTaskBtn = document.getElementById('archive-task-modal-btn');

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

    // Configure Archive/Unarchive button
    if (archiveTaskBtn) {
      if (task && task.id && !task.isArchived) { // Editing an existing, active task
        archiveTaskBtn.classList.remove('hidden');
        archiveTaskBtn.innerHTML = '<i class="fas fa-archive mr-1 sm:mr-2"></i> <span class="hidden sm:inline">Archive Task</span><span class="sm:hidden">Archive</span>';
        archiveTaskBtn.title = 'Archive Task';

        if (archiveTaskBtn._clickHandler) {
          archiveTaskBtn.removeEventListener('click', archiveTaskBtn._clickHandler);
        }
        archiveTaskBtn._clickHandler = () => {
          if (this.editingTaskId) {
            this.archiveTask(this.editingTaskId);
            this.hideTaskModal();
          }
        };
        archiveTaskBtn.addEventListener('click', archiveTaskBtn._clickHandler);
      } else if (task && task.id && task.isArchived) { // Editing an existing, ARCHIVED task
        archiveTaskBtn.classList.remove('hidden');
        archiveTaskBtn.innerHTML = '<i class="fas fa-box-open mr-1 sm:mr-2"></i> <span class="hidden sm:inline">Unarchive Task</span><span class="sm:hidden">Unarchive</span>';
        archiveTaskBtn.title = 'Unarchive Task';

        if (archiveTaskBtn._clickHandler) {
          archiveTaskBtn.removeEventListener('click', archiveTaskBtn._clickHandler);
        }
        archiveTaskBtn._clickHandler = () => {
          if (this.editingTaskId) {
            this.unarchiveTask(this.editingTaskId);
            this.hideTaskModal();
            // TODO: Refresh relevant views (archived list, potentially main board)
          }
        };
        archiveTaskBtn.addEventListener('click', archiveTaskBtn._clickHandler);
      } else { // New task or other cases
        archiveTaskBtn.classList.add('hidden');
        if (archiveTaskBtn._clickHandler) {
          archiveTaskBtn.removeEventListener('click', archiveTaskBtn._clickHandler);
          archiveTaskBtn._clickHandler = null;
        }
      }
    }
  }
  
  /**
   * Private helper method to render subtasks in the modal.
   * @param {string} parentTaskId - The ID of the parent task.
   */
  _renderSubtasks(parentTaskId) {
    const parentTask = useTaskStore.getState().getTaskById(parentTaskId);
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
      attachments: [],
      isArchived: false
    };
    useTaskStore.getState().addTask(newTask);
    this._logActivity(newTask.id, 'TASK_CREATED', 'Task was created.');

    // DOM update for the new task (will be store-driven eventually)
    const taskLists = document.querySelectorAll('.task-list');
    if (columnIndex >= 0 && columnIndex < taskLists.length) {
      const targetColumnElement = taskLists[columnIndex];
      this.renderTask(newTask, targetColumnElement);
    } else {
      console.warn(`Attempted to add task to an invalid column index: ${columnIndex}. Task data saved, but not rendered to a specific column.`);
    }
    // No explicit saveTasks() call needed here, store action handles it.
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
    const taskToUpdate = useTaskStore.getState().getTaskById(taskId);
    if (taskToUpdate) {
      // Important: Log activity based on the task *before* updates for accurate "from X to Y"
      const originalTaskForLog = { ...taskToUpdate }; // Shallow copy for logging

      const updates = {
        title,
        description,
        priority,
        dueDate,
        assignee,
      };
      useTaskStore.getState().updateTask(taskId, updates);

      // Log field changes by comparing with the state before update
      const updatedTaskForLog = useTaskStore.getState().getTaskById(taskId); // Get the task after update for "to Y" part

      if (originalTaskForLog.title !== updatedTaskForLog.title) {
        this._logActivity(taskId, 'FIELD_UPDATED', `Title changed from "${originalTaskForLog.title}" to "${updatedTaskForLog.title}".`);
      }
      if (originalTaskForLog.description !== updatedTaskForLog.description) {
        this._logActivity(taskId, 'FIELD_UPDATED', `Description updated.`);
      }
      if (originalTaskForLog.priority !== updatedTaskForLog.priority) {
        this._logActivity(taskId, 'FIELD_UPDATED', `Priority changed from "${originalTaskForLog.priority}" to "${updatedTaskForLog.priority}".`);
      }
      if (originalTaskForLog.dueDate !== updatedTaskForLog.dueDate) {
        this._logActivity(taskId, 'FIELD_UPDATED', `Due date changed from "${originalTaskForLog.dueDate || 'none'}" to "${updatedTaskForLog.dueDate || 'none'}".`);
      }
      if (originalTaskForLog.assignee !== updatedTaskForLog.assignee) {
        this._logActivity(taskId, 'FIELD_UPDATED', `Assignee changed from "${originalTaskForLog.assignee || 'none'}" to "${updatedTaskForLog.assignee || 'none'}".`);
      }

      // DOM update (for now, will be store-driven eventually)
      const taskElement = document.getElementById(`task-${taskId}`);
      if (taskElement && taskElement.parentElement) {
        const parentColumn = taskElement.parentElement;
        taskElement.remove();
        this.renderTask(updatedTaskForLog, parentColumn); // Render with the updated task data
      } else {
        console.warn(`Task element task-${taskId} not found for DOM update.`);
      }
    } else {
      console.warn(`Task with ID ${taskId} not found for update.`);
    }
  }

  /**
   * Deletes a task after confirmation.
   * @param {string} taskId - ID of the task to delete.
   */
  deleteTask(taskId) {
    if (!confirm('Are you sure you want to permanently delete this task? This action cannot be undone.')) return;

    const taskToDelete = useTaskStore.getState().getTaskById(taskId);
    if (taskToDelete) {
      const deletedTaskTitle = taskToDelete.title;
      // Important: Log activity using the task ID from taskToDelete, as _logActivity might try to find the task in the current state
      this._logActivity(taskToDelete.id, 'TASK_DELETED_PERMANENTLY', `Task "${deletedTaskTitle}" permanently deleted.`);
      useTaskStore.getState().deleteTask(taskId); // This will remove it from the store and persist

      const taskElement = document.getElementById(`task-${taskId}`);
      if (taskElement) {
        taskElement.remove();
      } else {
        console.warn(`Task element task-${taskId} not found for DOM removal.`);
      }
    } else {
      console.warn(`Task with ID ${taskId} not found for deletion.`);
    }
  }

  /**
   * Archives a task.
   * @param {string} taskId - The ID of the task to archive.
   */
  archiveTask(taskId) {
    const taskToArchive = useTaskStore.getState().getTaskById(taskId);
    if (taskToArchive) {
      useTaskStore.getState().archiveTask(taskId, true);
      this._logActivity(taskId, 'TASK_ARCHIVED', `Task "${taskToArchive.title}" archived.`);

      const taskElement = document.getElementById(`task-${taskId}`);
      if (taskElement) {
        taskElement.remove();
      }

      // No explicit saveTasks() call needed here.
    } else {
      console.warn(`Task with ID ${taskId} not found for archiving.`);
    }
  }

  /**
   * Unarchives a task.
   * @param {string} taskId - The ID of the task to unarchive.
   */
  unarchiveTask(taskId) {
    const taskToUnarchive = useTaskStore.getState().getTaskById(taskId);
    if (taskToUnarchive) {
      useTaskStore.getState().archiveTask(taskId, false); // Store handles unarchive
      this._logActivity(taskId, 'TASK_UNARCHIVED', `Task "${taskToUnarchive.title}" unarchived.`);
      // Re-rendering of the unarchived task to the board will be handled by the UI
      // component responsible for displaying the board, after it fetches updated task lists.
      // No explicit saveTasks() call needed here.
    } else {
      console.warn(`Task with ID ${taskId} not found for unarchiving.`);
    }
  }

  /**
   * Retrieves all archived tasks.
   * @returns {Array<Object>} An array of tasks where isArchived is true.
   */
  getArchivedTasks() {
    return useTaskStore.getState().tasks.filter(task => task.isArchived);
  }

  /**
   * Filters tasks based on a search term and renders the filtered list.
   * @param {string} searchTerm - Term used to filter tasks.
   */
  searchTasks(searchTerm) {
    const allTasksFromStore = useTaskStore.getState().tasks;
    const activeTasks = allTasksFromStore.filter(task => !task.isArchived);
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredTasks = activeTasks;
    } else {
      searchTerm = searchTerm.toLowerCase().trim();
      this.filteredTasks = activeTasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm)
        // Consider if other fields should be searchable, e.g., description
      );
    }
    this.renderFilteredTasks(); // This will render based on the now-filtered active tasks
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
    const allTasksFromStore = useTaskStore.getState().tasks;
    this.filteredTasks = allTasksFromStore.filter(task => !task.isArchived);
    this.renderFilteredTasks();
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
    // Define event handlers to pass to the TaskCard component
    const eventHandlers = {
      onArchiveTask: (taskId) => {
        this.archiveTask(taskId);
      },
      onEditTask: (taskToEdit) => {
        this.openTaskModal(taskToEdit.column, taskToEdit);
      }
    };

    // Create the card content using the component.
    const taskElement = TaskCard(task, eventHandlers);

    // If TaskCard returns null (e.g. on error), handle it
    if (!taskElement) {
        console.error(`Failed to render TaskCard for task ID: ${task.id}`);
        return;
    }
    // TaskCard now sets id, dataset.taskId, draggable, and base className.

    // --- Due Date Styling (Overdue/Due Soon Borders) ---
    // This logic remains in renderTask as it depends on boardManager context.
    const boardManager = this.boardManager;
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
        } else if (dayDiff === 0) { // Due today
          taskElement.classList.add('due-today', 'border-2', 'border-blue-500');
        } else if (dayDiff > 0 && dayDiff <= 3) { // Due soon
          taskElement.classList.add('due-soon', 'border-2', 'border-yellow-500');
        } else {
          // Not overdue, not due today, not due soon (or no specific state)
          // No border classes needed here as they were cleared
        }
      } else {
        // Task is in a "Done" column, not considered for these visual cues
      }
    } else {
      // No due date or boardManager not available
    }

    targetColumn.appendChild(taskElement);

    // --- Drag and Drop Event Listeners ---
    // These remain attached by TaskManager.renderTask to the taskElement created by TaskCard.
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
        const newColumnDomElement = elemBelow?.closest('.task-list');
        const taskId = taskElement.dataset.taskId;

        const localDragDropManager = this.dragDropManager;

        if (!taskId) {
            if (localDragDropManager) localDragDropManager.handleDragEnd(taskElement);
            return;
        }

        const taskToMoveInitial = useTaskStore.getState().getTaskById(taskId);
        if (!taskToMoveInitial) {
            if (localDragDropManager) localDragDropManager.handleDragEnd(taskElement);
            console.error("Task not found in store for touchend:", taskId);
            return;
        }

        if (newColumnDomElement) {
            const newColumnIndex = Number.parseInt(newColumnDomElement.dataset.index, 10);

            const placeholder = newColumnDomElement.querySelector('.task-placeholder');
            if (placeholder) {
                newColumnDomElement.insertBefore(taskElement, placeholder);
            } else {
                newColumnDomElement.appendChild(taskElement);
            }
            // Placeholder removal is handled by localDragDropManager.handleDragEnd

            let currentTasks = [...useTaskStore.getState().tasks];
            const taskToMoveIndexInCurrentTasks = currentTasks.findIndex(t => t.id === taskId);
            const taskDataForStore = { ...taskToMoveInitial, column: newColumnIndex };

            if (taskToMoveIndexInCurrentTasks !== -1) {
                currentTasks.splice(taskToMoveIndexInCurrentTasks, 1);
            } else {
                currentTasks = currentTasks.filter(t => t.id !== taskId);
            }

            const tasksInNewColumnDomOrder = Array.from(newColumnDomElement.querySelectorAll('.task:not(.task-placeholder)'))
                                              .map(el => el.dataset.taskId);

            const positionInDomColumn = tasksInNewColumnDomOrder.indexOf(taskId);
            let finalInsertIndexInStoreArray = -1;

            if (positionInDomColumn === -1) {
                console.error("Consistency error: Dragged task not found in its target DOM column after move.");
                let lastIndexOfColumn = -1;
                for(let i = currentTasks.length - 1; i >= 0; i--) {
                    if (currentTasks[i].column === newColumnIndex) {
                        lastIndexOfColumn = i;
                        break;
                    }
                }
                finalInsertIndexInStoreArray = lastIndexOfColumn === -1 ? currentTasks.length : lastIndexOfColumn + 1;
            } else if (tasksInNewColumnDomOrder.length === 1) {
                let targetIdx = 0;
                for (let i = 0; i < currentTasks.length; i++) {
                    if (currentTasks[i].column >= newColumnIndex) {
                        targetIdx = i;
                        break;
                    }
                    targetIdx = i + 1;
                }
                finalInsertIndexInStoreArray = targetIdx;
            } else if (positionInDomColumn === tasksInNewColumnDomOrder.length - 1) {
                let lastExistingTaskOfColumn = -1;
                for (let i = currentTasks.length - 1; i >= 0; i--) {
                    if (currentTasks[i].column === newColumnIndex) {
                        lastExistingTaskOfColumn = i;
                        break;
                    }
                }
                if (lastExistingTaskOfColumn !== -1) {
                    finalInsertIndexInStoreArray = lastExistingTaskOfColumn + 1;
                } else {
                    let targetIdx = 0;
                    for (let i = 0; i < currentTasks.length; i++) {
                        if (currentTasks[i].column >= newColumnIndex) {
                            targetIdx = i;
                            break;
                        }
                        targetIdx = i + 1;
                    }
                    finalInsertIndexInStoreArray = targetIdx;
                }
            } else {
                const nextTaskInDomId = tasksInNewColumnDomOrder[positionInDomColumn + 1];
                finalInsertIndexInStoreArray = currentTasks.findIndex(t => t.id === nextTaskInDomId);
                if (finalInsertIndexInStoreArray === -1) {
                    let lastExistingTaskOfColumn = -1;
                    for (let i = currentTasks.length - 1; i >= 0; i--) {
                        if (currentTasks[i].column === newColumnIndex) {
                            lastExistingTaskOfColumn = i;
                            break;
                        }
                    }
                    if (lastExistingTaskOfColumn !== -1) {
                        finalInsertIndexInStoreArray = lastExistingTaskOfColumn + 1;
                    } else {
                        finalInsertIndexInStoreArray = currentTasks.length;
                    }
                }
            }

            if (finalInsertIndexInStoreArray === -1 ) {
                finalInsertIndexInStoreArray = currentTasks.length;
            }

            currentTasks.splice(finalInsertIndexInStoreArray, 0, taskDataForStore);
            useTaskStore.getState().setTasksOrder(currentTasks);
        }

        if (localDragDropManager) localDragDropManager.handleDragEnd(taskElement);
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
    // taskElement.querySelector('.edit-task-btn')... // Handled by TaskCard
    // taskElement.querySelector('.task-card-archive-btn')... // Handled by TaskCard
  }

  /**
   * Sorts tasks within a specific board column by the given criteria.
   * @param {number} boardIndex - Index of the board column.
   * @param {string} sortBy - Field to sort by ('priority', 'dueDate', 'title').
   * @param {string} direction - Sort direction ('asc' or 'desc').
   */
  sortTasks(boardIndex, sortBy, direction) {
    const allTasks = [...useTaskStore.getState().tasks]; // Get a mutable copy
    const tasksInBoard = allTasks.filter(task => task.column === boardIndex);
    const otherTasks = allTasks.filter(task => task.column !== boardIndex);

    tasksInBoard.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'priority') {
        const priorityValues = { high: 3, medium: 2, low: 1 };
        const priorityA = priorityValues[a.priority.toLowerCase()] || 0;
        const priorityB = priorityValues[b.priority.toLowerCase()] || 0;
        comparison = priorityA - priorityB;
      } else if (sortBy === 'dueDate') {
        const dateA = a.dueDate ? new Date(a.dueDate) : null;
        const dateB = b.dueDate ? new Date(b.dueDate) : null;
        if (!dateA && !dateB) comparison = 0;
        else if (!dateA) comparison = 1;
        else if (!dateB) comparison = -1;
        else comparison = dateA - dateB;
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      }
      return direction === 'desc' ? -comparison : comparison;
    });

    // Reconstruct the full tasks array with sorted tasks for the specific board
    const finalTasks = [];
    const maxColumnIndex = Math.max(...allTasks.map(t => t.column), 0);
    for (let i = 0; i <= maxColumnIndex; i++) {
      if (i === boardIndex) {
        finalTasks.push(...tasksInBoard);
      } else {
        finalTasks.push(...otherTasks.filter(t => t.column === i));
      }
    }
    // Add any tasks that might have had a column index higher than max found (e.g. if board was deleted)
    // or ensure otherTasks only contains tasks from valid columns.
    // A simpler recombination if otherTasks are already grouped by their columns from original:
    // const reorderedTasks = [...otherTasks, ...tasksInBoard].sort((a,b) => a.column - b.column); // This might not be ideal if columns are not contiguous

    useTaskStore.getState().setAllTasks(finalTasks); // Update store with new global order
    this.renderAllTasks(); // Re-render all active tasks
  }

  /**
   * Adds a subtask to a parent task.
   * @param {string} parentTaskId - The ID of the parent task.
   * @param {string} subtaskTitle - The title of the new subtask.
   */
  addSubtask(parentTaskId, subtaskTitle) {
    const parentTask = useTaskStore.getState().getTaskById(parentTaskId);
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
    const newSubtasks = [...parentTask.subtasks, newSubtask];
    useTaskStore.getState().updateTask(parentTaskId, { subtasks: newSubtasks });
    this._logActivity(parentTaskId, 'SUBTASK_ACTIVITY', `Subtask "${newSubtask.title}" added.`);

    // Re-render the parent task card to reflect subtask changes (using the updated task from store)
    const updatedParentTask = useTaskStore.getState().getTaskById(parentTaskId);
    const taskElement = document.getElementById(`task-${parentTaskId}`);
    if (updatedParentTask && taskElement && taskElement.parentElement) {
      const parentColumn = taskElement.parentElement;
      taskElement.remove();
      this.renderTask(updatedParentTask, parentColumn);
    } else {
      console.warn(`Parent task element task-${parentTaskId} not found for DOM update after subtask change.`);
    }
    // Store update handles persistence
  }

  /**
   * Edits the title of an existing subtask.
   * @param {string} parentTaskId - The ID of the parent task.
   * @param {string} subtaskId - The ID of the subtask to edit.
   * @param {string} newTitle - The new title for the subtask.
   */
  editSubtask(parentTaskId, subtaskId, newTitle) {
    const parentTask = useTaskStore.getState().getTaskById(parentTaskId);
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
    const newSubtasks = parentTask.subtasks.map(sub =>
      sub.id === subtaskId ? { ...sub, title: newTitle } : sub
    );
    useTaskStore.getState().updateTask(parentTaskId, { subtasks: newSubtasks });
    this._logActivity(parentTaskId, 'SUBTASK_ACTIVITY', `Subtask "${originalSubtaskTitle}" title changed to "${newTitle}".`);

    // Re-render the parent task card
    const updatedParentTask = useTaskStore.getState().getTaskById(parentTaskId);
    const taskElement = document.getElementById(`task-${parentTaskId}`);
    if (updatedParentTask && taskElement && taskElement.parentElement) {
      const parentColumn = taskElement.parentElement;
      taskElement.remove();
      this.renderTask(updatedParentTask, parentColumn);
    } else {
      console.warn(`Parent task element task-${parentTaskId} not found for DOM update after subtask change.`);
    }
    // Store update handles persistence
  }

  /**
   * Toggles the completion status of a subtask.
   * @param {string} parentTaskId - The ID of the parent task.
   * @param {string} subtaskId - The ID of the subtask to toggle.
   */
  toggleSubtaskCompletion(parentTaskId, subtaskId) {
    const parentTask = useTaskStore.getState().getTaskById(parentTaskId);
    if (!parentTask) {
      console.error(`Parent task with ID ${parentTaskId} not found.`);
      return;
    }

    const subtask = parentTask.subtasks.find(sub => sub.id === subtaskId);
    if (!subtask) {
      console.error(`Subtask with ID ${subtaskId} not found in parent task ${parentTaskId}.`);
      return;
    }

    const newSubtasks = parentTask.subtasks.map(sub =>
      sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
    );
    const updatedSubtask = newSubtasks.find(s => s.id === subtaskId); // Get the updated subtask for logging
    useTaskStore.getState().updateTask(parentTaskId, { subtasks: newSubtasks });
    this._logActivity(parentTaskId, 'SUBTASK_ACTIVITY', `Subtask "${updatedSubtask.title}" marked as ${updatedSubtask.completed ? 'complete' : 'incomplete'}.`);

    // Re-render the parent task card
    const updatedParentTask = useTaskStore.getState().getTaskById(parentTaskId);
    const taskElement = document.getElementById(`task-${parentTaskId}`);
    if (updatedParentTask && taskElement && taskElement.parentElement) {
      const parentColumn = taskElement.parentElement;
      taskElement.remove();
      this.renderTask(updatedParentTask, parentColumn);
    } else {
      console.warn(`Parent task element task-${parentTaskId} not found for DOM update after subtask change.`);
    }
    // Store update handles persistence
  }

  /**
   * Deletes a subtask from a parent task.
   * @param {string} parentTaskId - The ID of the parent task.
   * @param {string} subtaskId - The ID of the subtask to delete.
   */
  deleteSubtask(parentTaskId, subtaskId) {
    const parentTask = useTaskStore.getState().getTaskById(parentTaskId);
    if (!parentTask) {
      console.error(`Parent task with ID ${parentTaskId} not found.`);
      return;
    }

    const subtaskToDelete = parentTask.subtasks.find(sub => sub.id === subtaskId);
    if (!subtaskToDelete) {
        console.warn(`Subtask with ID ${subtaskId} not found for deletion in task ${parentTaskId}.`);
        return;
    }
    const newSubtasks = parentTask.subtasks.filter(sub => sub.id !== subtaskId);
    useTaskStore.getState().updateTask(parentTaskId, { subtasks: newSubtasks });
    this._logActivity(parentTaskId, 'SUBTASK_ACTIVITY', `Subtask "${subtaskToDelete.title}" deleted.`);

    // Re-render the parent task card
    const updatedParentTask = useTaskStore.getState().getTaskById(parentTaskId);
    const taskElement = document.getElementById(`task-${parentTaskId}`);
    if (updatedParentTask && taskElement && taskElement.parentElement) {
      const parentColumn = taskElement.parentElement;
      taskElement.remove();
      this.renderTask(updatedParentTask, parentColumn);
    } else {
      console.warn(`Parent task element task-${parentTaskId} not found for DOM update after subtask change.`);
    }
    // Store update handles persistence
  }

  /**
   * Private helper method to log an activity for a task.
   * @param {string} taskId - The ID of the task.
   * @param {string} activityType - The type of activity (e.g., 'TASK_CREATED', 'TITLE_UPDATED').
   * @param {string} detailsString - A string describing the activity.
   */
  _logActivity(taskId, activityType, detailsString) {
    const task = useTaskStore.getState().getTaskById(taskId);

    // If task is not found (e.g., after permanent delete action has committed to store),
    // we can't update its activityLog. This is acceptable for permanent deletion logs
    // which are now handled before the task is removed from the store by deleteTask.
    // For other actions, task should exist.
    if (!task) {
      // For TASK_DELETED_PERMANENTLY, the log is now made *before* task removal from store,
      // so this check is mainly for other activity types on a non-existent task.
      if (activityType !== 'TASK_DELETED_PERMANENTLY') {
        console.warn(`Task with ID ${taskId} not found for logging activity type "${activityType}". Log skipped.`);
      }
      // If it was a delete log, the details are already captured and logged by deleteTask,
      // so we just return here as there's no task object to update in the store.
      return;
    }

    const newActivityLog = [
      {
        id: `log_${Date.now().toString()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        type: activityType,
        details: detailsString
      },
      ...(task.activityLog || [])
    ];
    useTaskStore.getState().updateTask(taskId, { activityLog: newActivityLog });
  }

  /**
   * Private helper method to render the activity log in the modal.
   * @param {string} parentTaskId - The ID of the parent task.
   */
  _renderActivityLog(parentTaskId) {
    const parentTask = useTaskStore.getState().getTaskById(parentTaskId);
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
    const parentTask = useTaskStore.getState().getTaskById(parentTaskId);
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
    let task = useTaskStore.getState().getTaskById(taskId);
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

      const newAttachments = [...(task.attachments || []), attachment];
      useTaskStore.getState().updateTask(taskId, { attachments: newAttachments });
      this._logActivity(taskId, 'ATTACHMENT_ADDED', `File "${attachment.fileName}" attached.`);
      // Store update handles persistence
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
    let task = useTaskStore.getState().getTaskById(taskId);
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
    const newAttachments = task.attachments.filter(att => att.id !== attachmentId);
    useTaskStore.getState().updateTask(taskId, { attachments: newAttachments });
    this._logActivity(taskId, 'ATTACHMENT_REMOVED', `File "${deletedAttachment.fileName}" removed.`);
    // Store update handles persistence
  }
}

export default TaskManager;
