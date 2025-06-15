import DragDropManager from './drag-drop-manager.js';
import { TaskCard } from '../components/TaskCard.js';
import TaskModalComponent from '../components/TaskModalComponent.js';
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
    // Cache a single instance of DragDropManager for reuse.
    this.dragDropManager = null;
    this.uiManager = null; // Placeholder for UIManager instance

    this.taskModalComponent = new TaskModalComponent({
        onSave: this._handleModalSave.bind(this),
        onCancel: this._handleModalCancel.bind(this),
        onArchiveRequest: this._handleModalArchiveRequest.bind(this)
    });
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
    this.editingTaskId = task ? task.id : null;
    this.taskModalComponent.show(task, index);
  }

  /**
   * Hides the task modal.
   */
  hideTaskModal() {
    this.taskModalComponent.hide();
  }

  _handleModalSave(taskData, isEditing, targetColumnIndex) {
    if (isEditing) {
        if (!taskData.id) {
            console.error("Task update requested without an ID.", taskData);
            alert("Error: Could not update task. Task ID missing.");
            return;
        }
        this.updateTask(taskData.id, taskData);
    } else {
        this.addTask(taskData, targetColumnIndex);
    }
    this.taskModalComponent.hide();
  }

  _handleModalCancel() {
    this.taskModalComponent.hide();
  }

  _handleModalArchiveRequest(taskId, currentIsArchived) {
    if (currentIsArchived) {
        this.unarchiveTask(taskId);
    } else {
        this.archiveTask(taskId);
    }
    this.taskModalComponent.hide();
    if (this.uiManager && typeof this.uiManager.refreshArchivedTasksModalIfOpen === 'function') {
        this.uiManager.refreshArchivedTasksModalIfOpen();
    }
  }

  /**
   * Adds a new task.
   * @param {object} taskData - Data for the new task from the modal.
   * @param {number} columnIndexFromModal - Board column index.
   */
  addTask(taskData, columnIndexFromModal) {
    const newTask = {
      id: Date.now().toString(), // Generate new ID
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      dueDate: taskData.dueDate,
      assignee: taskData.assignee,
      column: columnIndexFromModal,
      subtasks: taskData.subtasks || [],
      activityLog: [{ id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, timestamp: new Date().toISOString(), type: 'TASK_CREATED', details: 'Task was created.' }],
      attachments: taskData.attachments || [],
      isArchived: false
    };
    useTaskStore.getState().addTask(newTask);
    // _logActivity is implicitly called by updateTask if an initial activityLog is added,
    // but if not, or for the very first "Task Created" log, it can be direct.
    // The above definition directly includes the creation log.

    // DOM update for the new task
    const taskLists = document.querySelectorAll('.task-list');
    if (columnIndexFromModal >= 0 && columnIndexFromModal < taskLists.length) {
      const targetColumnElement = taskLists[columnIndexFromModal];
      // It's better to render the task from the store to ensure consistency
      const taskFromStore = useTaskStore.getState().getTaskById(newTask.id);
      if (taskFromStore) {
        this.renderTask(taskFromStore, targetColumnElement);
      } else {
        console.error(`Newly added task ${newTask.id} not found in store immediately after add.`);
      }
    } else {
      console.warn(`Attempted to add task to an invalid column index: ${columnIndexFromModal}. Task data saved, but not rendered to a specific column.`);
    }
  }


  _logFieldChanges(taskId, originalTask, newData) {
    const fieldsToCompare = ['title', 'description', 'priority', 'dueDate', 'assignee'];
    fieldsToCompare.forEach(field => {
        if (originalTask[field] !== newData[field]) {
            let logDetail = '';
            const originalValue = originalTask[field] || 'none';
            const newValue = newData[field] || 'none';
            if (field === 'description') {
                logDetail = `Description updated.`; // Keep it simple for potentially long text
            } else {
                logDetail = `${field.charAt(0).toUpperCase() + field.slice(1)} changed from "${originalValue}" to "${newValue}".`;
            }
            this._logActivity(taskId, 'FIELD_UPDATED', logDetail);
        }
    });

    // Basic subtask change logging (more granular logging is handled by component for its UI)
    if (JSON.stringify(originalTask.subtasks) !== JSON.stringify(newData.subtasks)) {
        this._logActivity(taskId, 'SUBTASK_ACTIVITY', 'Subtasks were updated.');
    }

    // Basic attachment change logging
    if (JSON.stringify(originalTask.attachments) !== JSON.stringify(newData.attachments)) {
        this._logActivity(taskId, 'ATTACHMENT_ACTIVITY', 'Attachments were updated.');
    }
  }

  /**
   * Updates an existing task.
   * @param {string} taskId - ID of the task to update.
   * @param {object} fullTaskDataFromModal - The full task data from the modal.
   */
  updateTask(taskId, fullTaskDataFromModal) {
    const originalTask = useTaskStore.getState().getTaskById(taskId);
    if (originalTask) {
      const updates = {
        title: fullTaskDataFromModal.title,
        description: fullTaskDataFromModal.description,
        priority: fullTaskDataFromModal.priority,
        dueDate: fullTaskDataFromModal.dueDate,
        assignee: fullTaskDataFromModal.assignee,
        subtasks: fullTaskDataFromModal.subtasks,
        attachments: fullTaskDataFromModal.attachments,
        // column and isArchived are handled by other dedicated methods or drag-n-drop
      };
      useTaskStore.getState().updateTask(taskId, updates);

      this._logFieldChanges(taskId, originalTask, fullTaskDataFromModal);

      // DOM update
      const taskElement = document.getElementById(`task-${taskId}`);
      const updatedTaskFromStore = useTaskStore.getState().getTaskById(taskId); // Get the final state
      if (taskElement && taskElement.parentElement && updatedTaskFromStore) {
        const parentColumn = taskElement.parentElement;
        taskElement.remove();
        this.renderTask(updatedTaskFromStore, parentColumn);
      } else if (updatedTaskFromStore) { // Task exists but element not found, maybe it's on an inactive board view
        console.warn(`Task element task-${taskId} not found for DOM update, but task data was updated in store.`);
         // Potentially call renderAllTasks() or a more targeted refresh if the updated task should be visible
        this.renderAllTasks(); // Fallback to full re-render if unsure
      } else {
         console.error(`Task ${taskId} not found in store after update operation.`);
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

        if (newColumnDomElement) {
          const newColumnIndex = Number.parseInt(newColumnDomElement.dataset.index, 10);
          let allTasks = [...useTaskStore.getState().tasks];
          const draggedTaskIndex = allTasks.findIndex(t => t.id === taskId);

          if (draggedTaskIndex === -1) {
            console.error("Dragged task not found in store:", taskId);
            if (localDragDropManager) localDragDropManager.handleDragEnd(taskElement);
            return;
          }

          const draggedTaskObject = allTasks.splice(draggedTaskIndex, 1)[0];
          draggedTaskObject.column = newColumnIndex;

          // Place task element in new DOM column
          const placeholder = newColumnDomElement.querySelector('.task-placeholder');
          if (placeholder) {
            newColumnDomElement.insertBefore(taskElement, placeholder);
          } else {
            newColumnDomElement.appendChild(taskElement);
          }

          const finalTasks = [];
          const tasksByColumn = new Map();
          for (const task of allTasks) {
            if (!tasksByColumn.has(task.column)) {
              tasksByColumn.set(task.column, []);
            }
            tasksByColumn.get(task.column).push(task);
          }

          const numBoards = this.boardManager.boards.length;
          for (let i = 0; i < numBoards; i++) {
            if (i === newColumnIndex) {
              const tasksInDomOrder = Array.from(newColumnDomElement.querySelectorAll('.task:not(.task-placeholder)'))
                                        .map(el => el.dataset.taskId);
              for (const domTaskId of tasksInDomOrder) {
                if (domTaskId === draggedTaskObject.id) {
                  finalTasks.push(draggedTaskObject);
                } else {
                  const columnTasks = tasksByColumn.get(i);
                  if (columnTasks) {
                    const taskIndex = columnTasks.findIndex(t => t.id === domTaskId);
                    if (taskIndex !== -1) {
                      finalTasks.push(columnTasks.splice(taskIndex, 1)[0]);
                    } else {
                       // Task might have been moved from this column already or belongs to another.
                       // Check allTasks (which is now tasksByColumn effectively)
                        let foundTask = null;
                        for (const [colIdx, tasksInCol] of tasksByColumn.entries()) {
                            const idx = tasksInCol.findIndex(t => t.id === domTaskId);
                            if (idx !== -1) {
                                foundTask = tasksInCol.splice(idx, 1)[0];
                                break;
                            }
                        }
                        if (foundTask) {
                            finalTasks.push(foundTask);
                        } else {
                            console.warn(`Task ${domTaskId} from DOM order not found in remaining tasks for column ${i} or other columns.`);
                        }
                    }
                  }
                }
              }
              // Add any remaining tasks that were in this column but not in DOM order (should not happen if DOM is source of truth for order)
              if (tasksByColumn.has(i)) {
                tasksByColumn.get(i).forEach(task => {
                    console.warn(`Task ${task.id} was in column ${i} but not in DOM order, appending.`);
                    finalTasks.push(task);
                });
                tasksByColumn.delete(i);
              }
            } else {
              if (tasksByColumn.has(i)) {
                finalTasks.push(...tasksByColumn.get(i));
                tasksByColumn.delete(i);
              }
            }
          }

          // Append tasks from any columns not iterated (e.g., if numBoards was wrong or tasks have invalid column indices)
          for (const [columnIndex, tasks] of tasksByColumn.entries()) {
            console.warn(`Tasks found in unexpected column ${columnIndex}, appending them:`, tasks);
            finalTasks.push(...tasks);
          }

          useTaskStore.getState().setTasksOrder(finalTasks);
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
