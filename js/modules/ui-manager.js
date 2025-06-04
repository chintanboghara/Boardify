/**
 * UIManager handles user interface interactions and DOM events
 * for board and task management.
 */
class UIManager {
  /**
   * Creates an instance of UIManager.
   * @param {Object} boardManager - The BoardManager instance.
   * @param {Object} taskManager - The TaskManager instance.
   * @param {Object} dragDropManager - The DragDropManager instance.
   */
  constructor(boardManager, taskManager, dragDropManager) {
    this.boardManager = boardManager;
    this.taskManager = taskManager;
    this.dragDropManager = dragDropManager;
  }

  /**
   * Caches key DOM elements used by the UI.
   */
  cacheDOM() {
    this.editBoardModal = document.getElementById('edit-board-modal');
    this.closeEditBoardModal = document.getElementById('close-edit-board-modal');
    this.editBoardForm = document.getElementById('edit-board-form');
    this.boardNameInput = document.getElementById('board-name-input');
    this.boardColorInput = document.getElementById('board-color-input');
    this.cancelEditBoard = document.getElementById('cancel-edit-board');
    this.clearBoardBtn = document.getElementById('clear-board-btn');
    this.taskModal = document.getElementById('task-modal');
    this.taskForm = document.getElementById('task-form');

    // Archived Tasks Modal Elements
    this.viewArchivedTasksBtn = document.getElementById('view-archived-tasks-btn');
    this.archivedTasksModal = document.getElementById('archived-tasks-modal');
    this.closeArchivedTasksModalBtn = document.getElementById('close-archived-tasks-modal');
    this.archivedTasksListElement = document.getElementById('archived-tasks-list');
    this.noArchivedTasksMessage = document.getElementById('no-archived-tasks-message');
    this.exportDataBtn = document.getElementById('export-data-btn');

    // Import Data Elements
    this.importDataBtn = document.getElementById('import-data-btn');
    this.importFileInput = document.getElementById('import-file-input');
  }

  /**
   * Attaches global event listeners for modals and form interactions.
   */
  attachGlobalEvents() {
    // Clear board button event.
    if (this.clearBoardBtn) {
      this.clearBoardBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all tasks from this board?')) {
          if (this.boardManager.clearBoard(this.taskManager)) {
            this.taskManager.renderAllTasks();
          }
        }
      });
    }

    // Close the edit board modal.
    if (this.closeEditBoardModal) {
      this.closeEditBoardModal.addEventListener('click', () =>
        this.boardManager.hideEditBoardModal()
      );
    }

    // Cancel board edit event.
    if (this.cancelEditBoard) {
      this.cancelEditBoard.addEventListener('click', () =>
        this.boardManager.hideEditBoardModal()
      );
    }

    // Attach event listeners to non-submit buttons inside the task modal to close it.
    if (this.taskModal) {
      const closeModalButtons = this.taskModal.querySelectorAll('button:not([type="submit"])');
      closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
          this.taskManager.hideTaskModal();
        });
      });
    }

    // Handle task form submission.
    if (this.taskForm) {
      this.taskForm.addEventListener('submit', e => {
        e.preventDefault();
        this.taskManager.handleTaskFormSubmit();
      });
    }

    // Event listener for sort by due date buttons
    const boardContainer = document.querySelector('.board');
    if (boardContainer) {
      boardContainer.addEventListener('click', event => {
        const sortButton = event.target.closest('.sort-by-due-date-btn');
        if (sortButton) {
          const boardIndex = parseInt(sortButton.dataset.boardIndex, 10);
          let currentSortDirection = sortButton.dataset.sortDirection;
          let newSortDirection;

          if (currentSortDirection === 'asc') {
            newSortDirection = 'desc';
          } else if (currentSortDirection === 'desc') {
            newSortDirection = 'asc'; // Cycle back to asc after desc
          } else { // Undefined or any other value
            newSortDirection = 'asc';
          }

          this.taskManager.sortTasks(boardIndex, 'dueDate', newSortDirection);
          sortButton.dataset.sortDirection = newSortDirection;

          const icon = sortButton.querySelector('i');
          icon.classList.remove('fa-calendar-alt', 'fa-sort-amount-up', 'fa-sort-amount-down');
          if (newSortDirection === 'asc') {
            icon.classList.add('fa-sort-amount-up');
          } else {
            icon.classList.add('fa-sort-amount-down');
          }
        }

        // Event listener for sort by priority buttons
        const sortPriorityButton = event.target.closest('.sort-by-priority-btn');
        if (sortPriorityButton) {
          const boardIndex = parseInt(sortPriorityButton.dataset.boardIndex, 10);
          let currentSortDirection = sortPriorityButton.dataset.sortDirection;
          let newSortDirection;

          if (currentSortDirection === 'desc') {
            newSortDirection = 'asc';
          } else { // Undefined or 'asc'
            newSortDirection = 'desc'; 
          }

          this.taskManager.sortTasks(boardIndex, 'priority', newSortDirection);
          sortPriorityButton.dataset.sortDirection = newSortDirection;

          const icon = sortPriorityButton.querySelector('i');
          icon.classList.remove('fa-star', 'fa-sort-amount-up', 'fa-sort-amount-down');
          if (newSortDirection === 'asc') {
            icon.classList.add('fa-sort-amount-up');
          } else {
            icon.classList.add('fa-sort-amount-down');
          }
        }
      });
    }

    // Archived Tasks Modal Listeners
    if (this.viewArchivedTasksBtn) {
      this.viewArchivedTasksBtn.addEventListener('click', () => this.openArchivedTasksModal());
    }
    if (this.closeArchivedTasksModalBtn) {
      this.closeArchivedTasksModalBtn.addEventListener('click', () => this.hideArchivedTasksModal());
    }
    if (this.archivedTasksModal) {
      this.archivedTasksModal.addEventListener('click', (event) => {
        if (event.target === this.archivedTasksModal) { // Click on backdrop
          this.hideArchivedTasksModal();
        }
      });
    }
  }

  /**
   * Attaches event listeners for board interactions (edit, delete, sort, add task, etc.).
   * @param {Object} boardManager - The BoardManager instance.
   * @param {Object} taskManager - The TaskManager instance.
   * @param {Object} dragDropManager - The DragDropManager instance.
   */
  attachBoardEventListeners(boardManager, taskManager, dragDropManager) {
    // Toggle board options menu when clicking the options button.
    document.querySelectorAll('.board-options-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const index = btn.dataset.index;
        const menu = document.querySelector(`.board-options-menu[data-index="${index}"]`);
        // Hide all other menus.
        document.querySelectorAll('.board-options-menu').forEach(m => {
          if (m !== menu) m.classList.add('hidden');
        });
        menu.classList.toggle('hidden');
      });
    });

    // Close any open board options menus when clicking outside.
    document.addEventListener('click', () => {
      document.querySelectorAll('.board-options-menu').forEach(menu => menu.classList.add('hidden'));
    });

    // Attach event listeners for editing a board.
    document.querySelectorAll('.edit-board-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = Number.parseInt(btn.dataset.index, 10);
        boardManager.openEditBoardModal(index);
      });
    });

    // Attach event listeners for deleting a board.
    document.querySelectorAll('.delete-board-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = Number.parseInt(btn.dataset.index, 10);
        if (boardManager.deleteBoard(index, taskManager)) {
          boardManager.renderBoards(this, taskManager, dragDropManager);
        }
      });
    });

    // Attach event listeners for sorting tasks in a board.
    document.querySelectorAll('.sort-board-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = Number.parseInt(btn.dataset.index, 10);
        boardManager.showSortOptions(index, taskManager);
      });
    });

    // Attach event listeners for adding new tasks via the plus button.
    document.querySelectorAll('.plus-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = Number.parseInt(btn.dataset.index, 10);
        taskManager.openTaskModal(index);
      });
    });

    // Attach event listeners for adding tasks from the add task button.
    document.querySelectorAll('.add-task-btn').forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();
        const index = Number.parseInt(button.dataset.index, 10);
        taskManager.openTaskModal(index);
      });
    });

    // Initialize drag and drop for all task lists.
    const taskLists = document.querySelectorAll('.task-list');
    dragDropManager.setupDragAndDrop(taskLists);
  }

  /**
   * Applies styling to task cards, including due date display and overdue highlighting.
   * This method should be called after tasks are rendered or updated.
   */
  applyTaskStyling() {
    const taskElements = document.querySelectorAll('.task'); // Selector for task card elements
    const tasksData = this.taskManager.getTasks(); // Get all task data

    taskElements.forEach(taskElement => {
      const taskId = taskElement.dataset.taskId;
      const taskData = tasksData.find(t => t.id === taskId);

      if (!taskData) {
        return; // Skip if task data not found for this element
      }

      // --- Display Due Date ---
      // Remove existing due date display to avoid duplication
      const existingDueDateElement = taskElement.querySelector('.task-due-date-display');
      if (existingDueDateElement) {
        existingDueDateElement.remove();
      }

      if (taskData.dueDate) {
        const dueDateElement = document.createElement('p');
        dueDateElement.classList.add('text-sm', 'task-due-date-display'); // Add a class for easy selection
        
        const dueDate = new Date(taskData.dueDate);
        // Adjust for timezone to display date as entered
        const userTimezoneOffset = dueDate.getTimezoneOffset() * 60000;
        const correctedDueDate = new Date(dueDate.getTime() + userTimezoneOffset);
        
        dueDateElement.textContent = `Due: ${correctedDueDate.toLocaleDateString()}`;
        
        // Insert due date before the action buttons div or as the last content item
        const actionsDiv = taskElement.querySelector('.flex.justify-end.space-x-2');
        if (actionsDiv) {
          actionsDiv.parentNode.insertBefore(dueDateElement, actionsDiv);
        } else {
          taskElement.appendChild(dueDateElement); // Fallback if structure is different
        }
      }

      // --- Highlight Overdue Tasks ---
      let isOverdue = false;
      if (taskData.dueDate && this.boardManager && this.boardManager.boards) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today's date

        const dueDate = new Date(taskData.dueDate);
         // Adjust for timezone to compare dates correctly
        const userTimezoneOffset = dueDate.getTimezoneOffset() * 60000;
        const correctedDueDate = new Date(dueDate.getTime() + userTimezoneOffset);


        const board = this.boardManager.boards[taskData.column];
        const isDoneColumn = board && board.title && board.title.toLowerCase().includes('done');

        if (correctedDueDate < today && !isDoneColumn) {
          isOverdue = true;
        }
      }

      const dueDateDisplayElement = taskElement.querySelector('.task-due-date-display');

      if (isOverdue) {
        taskElement.classList.add('overdue-task-highlight', 'border-2', 'border-red-500');
        if (dueDateDisplayElement) {
          dueDateDisplayElement.classList.add('text-red-500', 'dark:text-red-400');
          dueDateDisplayElement.classList.remove('text-gray-600', 'dark:text-gray-400');
        }
      } else {
        taskElement.classList.remove('overdue-task-highlight', 'border-2', 'border-red-500');
        if (dueDateDisplayElement) {
          dueDateDisplayElement.classList.remove('text-red-500', 'dark:text-red-400');
          dueDateDisplayElement.classList.add('text-gray-600', 'dark:text-gray-400');
        }
      }
    });
  }

  openArchivedTasksModal() {
    if (!this.archivedTasksModal) return;
    this._renderArchivedTaskList();
    this.archivedTasksModal.classList.remove('hidden');
    this.archivedTasksModal.classList.add('flex');
  }

  hideArchivedTasksModal() {
    if (!this.archivedTasksModal) return;
    this.archivedTasksModal.classList.add('hidden');
    this.archivedTasksModal.classList.remove('flex');
  }

  _renderArchivedTaskList() {
    if (!this.archivedTasksListElement || !this.taskManager || !this.noArchivedTasksMessage) return;

    const archivedTasks = this.taskManager.getArchivedTasks();
    this.archivedTasksListElement.innerHTML = ''; // Clear existing list

    if (archivedTasks.length === 0) {
      this.noArchivedTasksMessage.classList.remove('hidden');
      return;
    }
    this.noArchivedTasksMessage.classList.add('hidden');

    archivedTasks.forEach(task => {
      const listItem = document.createElement('li');
      listItem.className = 'flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-md shadow-sm';

      let taskInfoHtml = `
        <div class="flex-grow mb-2 sm:mb-0">
          <h4 class="font-medium text-gray-800 dark:text-gray-200">${task.title}</h4>
          <p class="text-xs text-gray-500 dark:text-gray-400">Priority: ${task.priority} | Due: ${task.dueDate || 'N/A'}</p>
        </div>
      `;
      // Add more details if needed, like description excerpt or assignee

      let buttonsHtml = `
        <div class="flex space-x-2 flex-shrink-0 mt-2 sm:mt-0 self-end sm:self-center">
          <button class="unarchive-btn text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 py-1 px-2 rounded hover:bg-indigo-100 dark:hover:bg-gray-700" data-task-id="${task.id}" title="Unarchive Task">
            <i class="fas fa-box-open mr-1"></i> Unarchive
          </button>
          <button class="perm-delete-btn text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600 py-1 px-2 rounded hover:bg-red-100 dark:hover:bg-gray-700" data-task-id="${task.id}" title="Delete Permanently">
            <i class="fas fa-trash-alt mr-1"></i> Delete
          </button>
        </div>
      `;
      listItem.innerHTML = taskInfoHtml + buttonsHtml;

      listItem.querySelector('.unarchive-btn').addEventListener('click', (e) => {
        const taskId = e.currentTarget.dataset.taskId;
        this.taskManager.unarchiveTask(taskId);
        this._renderArchivedTaskList(); // Refresh this modal's list
        this.taskManager.renderAllTasks(); // Refresh the main board view
      });

      listItem.querySelector('.perm-delete-btn').addEventListener('click', (e) => {
        const taskId = e.currentTarget.dataset.taskId;
        // The confirm dialog is in taskManager.deleteTask
        this.taskManager.deleteTask(taskId);
        this._renderArchivedTaskList(); // Refresh this modal's list
      });
      this.archivedTasksListElement.appendChild(listItem);
    });
  }
}

export default UIManager;
