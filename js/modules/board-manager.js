import { defaultBoards, defaultTasks, DEFAULT_BOARD_THEME_ID, BOARD_THEMES } from './constants';
import { useTaskStore } from '../store/taskStore.js';

/**
 * Manages boards within the Boardify application.
 */
class BoardManager {
  constructor(userId) {
    this.userId = userId;
    this.boardsKey = this.userId ? `boards_${this.userId}` : 'boards_guest'; // boards_guest for null userId
    // Load boards from localStorage or use default boards if not present.
    // this.boards = JSON.parse(localStorage.getItem(this.boardsKey)) || defaultBoards;

    let loadedBoards = JSON.parse(localStorage.getItem(this.boardsKey));
    if (loadedBoards) {
        this.boards = loadedBoards;
    } else {
        // Deep copy defaultBoards to prevent modification of the constant
        this.boards = JSON.parse(JSON.stringify(defaultBoards));
    }

    let migrationPerformed = false;
    this.boards.forEach(board => {
      if (board.color && board.themeId === undefined) {
        board.themeId = DEFAULT_BOARD_THEME_ID;
        delete board.color;
        migrationPerformed = true;
        console.log(`Migrated board "${board.title}" to use default theme.`);
      } else if (board.themeId === undefined) {
        board.themeId = DEFAULT_BOARD_THEME_ID;
        migrationPerformed = true;
      }
    });

    if (migrationPerformed) {
      this.saveBoards();
    }

    this.currentBoardIndex = null;
    this.boardsContainer = null;
    this.editBoardModal = null;
    this.closeEditBoardModal = null;
    this.editBoardForm = null;
    this.boardNameInput = null;
    this.boardColorInput = null;
    this.cancelEditBoard = null;
    this.clearBoardBtn = null;

    // References to external managers.
    this.uiManager = null;
    this.taskManager = null; // This will be set by Boardify class
    this.dragDropManager = null; // For task drag-drop, not board drag-drop.

    // Board drag-and-drop specific properties
    this.boardDropPlaceholder = document.createElement('div');
    this.boardDropPlaceholder.className = 'board-drop-placeholder flex-shrink-0 rounded-lg border-2 border-dashed border-indigo-600 dark:border-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20 w-[350px] xl:w-[400px] min-h-[74dvh] md:min-h-[78dvh] mx-1 flex items-center justify-center text-indigo-600 dark:text-indigo-400';
    this.boardDropPlaceholder.innerHTML = `<span class="text-sm font-medium">Drop here</span>`;
    this.draggedBoardElement = null;
    this.boardsBeforeDrag = null; // To store board order before drag
    this.boardDragDropInitialized = false;

    // Initialize localStorage data if boards are not already set for this user.
    if (localStorage.getItem(this.boardsKey) === null) {
      this.saveBoards(); // Save default boards for the new user
      // Default tasks should be initialized by TaskManager for this user
      // This will be handled when TaskManager is initialized with the userId
      if (this.taskManager) {
        this.taskManager.initializeDefaultTasksForUser();
      } else {
        // Fallback if taskManager is not yet initialized, though ideally it should be.
        // This indicates a potential dependency issue if called before taskManager is ready.
        // For now, we'll rely on TaskManager's own initialization.
        console.warn('BoardManager: TaskManager not available during board initialization for default tasks. TaskManager should handle its own default task initialization.');
      }
    }
  }

  /**
   * Initializes default tasks in localStorage.
   * This method is now intended to be called by TaskManager or be part of TaskManager's own init.
   * Kept here for reference during refactor, but should likely be removed or re-purposed.
   * For now, it's best that TaskManager handles its own default task setup using its user-specific key.
   */
  initializeDefaultTasks() {
    // DEPRECATED in BoardManager: TaskManager should handle this.
    // If this.taskManager is available (set after BoardManager instantiation),
    // it can be called to set up its own default tasks.
    if (this.taskManager) {
      this.taskManager.initializeDefaultTasksForUser();
    } else {
      // This path should ideally not be hit if Boardify initializes managers correctly.
      const tasksKey = this.userId ? `tasks_${this.userId}` : 'tasks_guest';
      if (localStorage.getItem(tasksKey) === null) {
        localStorage.setItem(tasksKey, JSON.stringify(defaultTasks));
      }
    }
  }

  /**
   * Saves current boards to localStorage using the user-specific key.
   */
  saveBoards() {
    localStorage.setItem(this.boardsKey, JSON.stringify(this.boards));
  }

  /**
   * Prompts the user to add a new board and saves it.
   * @returns {boolean} True if a board was added, false otherwise.
   */
  addNewBoard() {
    const boardTitle = prompt('Enter the name of the new board:');
    if (!boardTitle || boardTitle.trim() === '') {
      alert('Board name cannot be empty.');
      return false;
    }
    const newBoard = {
      title: boardTitle.trim(),
      color: '#d1d5db', // Default board color.
    };
    this.boards.push(newBoard);
    this.saveBoards();
    return true;
  }

  /**
   * Renders all boards and attaches the necessary event listeners.
   * @param {Object} uiManager - UI Manager instance.
   * @param {Object} taskManager - Task Manager instance.
   * @param {Object} dragDropManager - Drag & Drop Manager instance.
   */
  renderBoards(uiManager, taskManager, dragDropManager) {
    this.uiManager = uiManager;
    this.taskManager = taskManager;
    this.dragDropManager = dragDropManager;

    // Get the container element for boards.
    this.boardsContainer = document.querySelector('.board');
    if (!this.boardsContainer) return;

    // Clear existing content.
    this.boardsContainer.innerHTML = '';

    // Render each board.
    this.boards.forEach((board, index) => {
      const boardElement = document.createElement('div');
      boardElement.className =
        'rounded-lg min-h-[74dvh] md:min-h-[78dvh] overflow-hidden flex flex-col w-[350px] xl:w-[400px] flex-shrink-0 board-draggable-item'; // Added common class

      // Make the board draggable and store its index
      boardElement.draggable = true;
      boardElement.dataset.boardIndex = index;

      boardElement.addEventListener('dragstart', (e) => {
        const interactiveElements = '.sort-by-due-date-btn, .sort-by-priority-btn, .plus-btn, .board-options-btn, .edit-board-btn, .delete-board-btn, .sort-board-btn';
        if (e.target.closest(interactiveElements) || e.target.closest('.task')) {
          e.preventDefault();
          return;
        }
        e.stopPropagation();
        const draggedBoardIndex = e.currentTarget.dataset.boardIndex;
        e.dataTransfer.setData('application/boardify-board-index', draggedBoardIndex);
        e.dataTransfer.effectAllowed = 'move';
        this.boardsBeforeDrag = [...this.boards]; // Snapshot board order
        setTimeout(() => {
          e.currentTarget.classList.add('dragging-board');
        }, 0);
      });

      boardElement.addEventListener('dragend', (e) => {
        e.stopPropagation();
        e.currentTarget.classList.remove('dragging-board');
        this.boardsBeforeDrag = null; // Clear snapshot
        const existingPlaceholder = this.boardsContainer.querySelector('.board-drop-placeholder');
        if (existingPlaceholder) {
          existingPlaceholder.remove();
        }
      });

      boardElement.innerHTML = `
        <div class="my-4 board-header-container">
          <div class="flex justify-between items-center flex-shrink-0 relative">
            <div>
              <h3 class="font-semibold text-sm md:text-base px-2 py-1 rounded board-title-heading">
                ${board.title}
              </h3>
            </div>
            <div class="flex items-center space-x-2">
              <button class="sort-by-due-date-btn cursor-pointer rounded p-1 text-gray-700 transition-colors hover:bg-white/20 dark:text-gray-800 dark:hover:bg-gray-700/20" data-board-index="${index}" aria-label="Sort by Due Date">
                <i class="fas fa-calendar-alt text-sm"></i>
              </button>
              <button class="sort-by-priority-btn cursor-pointer rounded p-1 text-gray-700 transition-colors hover:bg-white/20 dark:text-gray-800 dark:hover:bg-gray-700/20" data-board-index="${index}" aria-label="Sort by Priority">
                <i class="fas fa-star text-sm"></i>
              </button>
              <button class="plus-btn cursor-pointer text-gray-700 dark:text-gray-200 hover:bg-white/20 dark:hover:bg-gray-700/20 p-1 rounded transition-colors" data-index="${index}">
                <i class="fas fa-plus text-sm"></i>
              </button>
              <button class="board-options-btn cursor-pointer text-gray-700 dark:text-gray-200 hover:bg-white/20 dark:hover:bg-gray-700/20 p-1 rounded transition-colors" data-index="${index}">
                <i class="fas fa-ellipsis-h text-sm"></i>
              </button>
              <div class="board-options-menu hidden absolute right-0 top-full mt-1 bg-white dark:bg-[#121617] rounded shadow-lg z-10 w-32 py-1" data-index="${index}">
                <button class="edit-board-btn w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" data-index="${index}">
                  <i class="fas fa-pencil-alt mr-2"></i> Edit
                </button>
                <button class="delete-board-btn w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" data-index="${index}">
                  <i class="fas fa-trash mr-2"></i> Delete
                </button>
                <button class="sort-board-btn w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" data-index="${index}">
                  <i class="fas fa-sort mr-2"></i> Sort
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="task-list bg-gray-50 rounded-lg dark:bg-[#202227] flex-grow p-3 overflow-y-auto space-y-3 h-full" data-index="${index}"></div>
        <div class="bg-gray-50 dark:bg-[#202227] flex-shrink-0 p-4">
          <button class="add-task-btn text-[14px] flex w-full cursor-pointer items-center justify-center gap-2 text-gray-600 transition-opacity duration-200 ease-in-out hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200" data-index="${index}">
            <i class="fas fa-plus text-[12px]"></i> Add Task
          </button>
        </div>
      `;
      this.boardsContainer.appendChild(boardElement);

      // Apply theme colors
      const themeId = board.themeId || DEFAULT_BOARD_THEME_ID;
      let selectedTheme = BOARD_THEMES.find(t => t.id === themeId);

      if (!selectedTheme) {
        selectedTheme = BOARD_THEMES.find(t => t.id === DEFAULT_BOARD_THEME_ID);
        if (!selectedTheme && BOARD_THEMES.length > 0) {
          selectedTheme = BOARD_THEMES[0]; // Fallback to the very first theme
        }
      }

      if (selectedTheme && selectedTheme.colors) {
        const headerTitleElement = boardElement.querySelector('.board-title-heading');
        const taskListElement = boardElement.querySelector('.task-list');

        if (headerTitleElement) {
          headerTitleElement.style.backgroundColor = selectedTheme.colors.headerBackground || '';
          headerTitleElement.style.color = selectedTheme.colors.headerText || this.getContrastingText(selectedTheme.colors.headerBackground || '#FFFFFF');
        }
        if (taskListElement) {
          taskListElement.style.backgroundColor = selectedTheme.colors.boardBackground || '';
        }

        // Apply accent color to the main boardElement's border.
        // Add base border classes if not already part of boardElement.className
        if (!boardElement.classList.contains('border-2')) { // Example check
            boardElement.classList.add('border-2', 'border-solid');
        }
        boardElement.style.borderColor = selectedTheme.colors.accentColor || 'transparent';
      }
    });

    // Create and append "Add Board" button.
    const addBoardButton = document.createElement('button');
    addBoardButton.id = 'add-new-board-btn';
    addBoardButton.className =
      'flex min-w-[360px] min-h-[68dvh] mt-16 md:min-h-[72dvh] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-400 dark:border-gray-600 dark:text-gray-500 dark:hover:bg-[#202227] dark:hover:text-gray-300';
    addBoardButton.innerHTML = `
      <div>
        <i class="fas fa-plus mb-2 mr-1"></i>
        <span class="font-medium">Add Board</span>
      </div>
    `;
    addBoardButton.addEventListener('click', () => {
      if (this.addNewBoard()) {
        // Re-render boards after adding a new board.
        this.renderBoards(uiManager, taskManager, dragDropManager);
      }
    });
    this.boardsContainer.appendChild(addBoardButton);

    // Attach event listeners for board actions.
    uiManager.attachBoardEventListeners(this, taskManager, dragDropManager);
    // Render all tasks for the boards.
    taskManager.renderAllTasks();
    this.initializeBoardDragDropListeners();
  }

  getBoardDragAfterElement(x) {
    const draggableBoards = [...this.boardsContainer.querySelectorAll('.board-draggable-item:not(.dragging-board)')];

    let closest = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    draggableBoards.forEach(boardEl => {
      const box = boardEl.getBoundingClientRect();
      const distance = x - (box.left + box.width / 2);

      if (distance < 0 && Math.abs(distance) < closestDistance) {
        closestDistance = Math.abs(distance);
        closest = boardEl;
      }
    });
    return closest;
  }

  initializeBoardDragDropListeners() {
    if (this.boardDragDropInitialized || !this.boardsContainer) {
      return;
    }

    this.boardsContainer.addEventListener('dragenter', (e) => {
      if (!e.dataTransfer.types.includes('application/boardify-board-index')) {
        return;
      }
      e.preventDefault(); // Important for allowing drop
    });

    this.boardsContainer.addEventListener('dragover', (e) => {
      if (!e.dataTransfer.types.includes('application/boardify-board-index')) {
        return;
      }
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const draggingBoard = this.boardsContainer.querySelector('.dragging-board');
      if (!draggingBoard) return;

      const afterElement = this.getBoardDragAfterElement(e.clientX);
      if (afterElement) {
        this.boardsContainer.insertBefore(this.boardDropPlaceholder, afterElement);
      } else {
        const addBoardBtn = this.boardsContainer.querySelector('#add-new-board-btn');
        if (addBoardBtn) {
          this.boardsContainer.insertBefore(this.boardDropPlaceholder, addBoardBtn);
        } else {
          this.boardsContainer.appendChild(this.boardDropPlaceholder);
        }
      }
    });

    this.boardsContainer.addEventListener('dragleave', (e) => {
      if (!e.dataTransfer.types.includes('application/boardify-board-index')) {
        return;
      }
      if (e.target === this.boardsContainer && !this.boardsContainer.contains(e.relatedTarget) && this.boardDropPlaceholder.parentNode) {
         this.boardDropPlaceholder.remove();
      }
    });

    this.boardsContainer.addEventListener('drop', (e) => {
      if (!e.dataTransfer.types.includes('application/boardify-board-index')) {
        return;
      }
      e.preventDefault();
      if (this.boardDropPlaceholder.parentNode) {
        this.boardDropPlaceholder.remove();
      }

      const draggedBoardIndex = parseInt(e.dataTransfer.getData('application/boardify-board-index'), 10);
      const allBoardElements = [...this.boardsContainer.querySelectorAll('.board-draggable-item:not(.dragging-board)')];

      let targetDropIndex = allBoardElements.findIndex(boardEl => {
          const rect = boardEl.getBoundingClientRect();
          // Find if dropped before this element
          return e.clientX < rect.left + rect.width / 2;
      });

      if (targetDropIndex === -1) { // Dropped after all other boards or in empty space
          targetDropIndex = allBoardElements.length;
      }

      // Adjust targetDropIndex if dragging from left to right past its original position
      // This logic is subtle: if dragging an item from index 2 to index 5,
      // after removing it from index 2, the original index 5 is now 4.
      // However, the splice operation itself handles this well if we calculate targetDropIndex
      // based on the array *before* the dragged item is removed, then adjust.
      // A simpler way is to remove, then calculate target in the modified array.
      // The current targetDropIndex is based on `allBoardElements` which doesn't include the dragged one.

      // Update data model
      const movedBoard = this.boards.splice(draggedBoardIndex, 1)[0];
      this.boards.splice(targetDropIndex, 0, movedBoard);

      this.saveBoards();

      // === BEGIN NEW TASK COLUMN RE-MAPPING LOGIC ===
      if (this.boardsBeforeDrag) {
          let allTasks = JSON.parse(JSON.stringify(useTaskStore.getState().tasks)); // Deep copy for modification
          let tasksModified = false;

          allTasks.forEach(task => {
              if (typeof task.column === 'number' && task.column >= 0 && task.column < this.boardsBeforeDrag.length) {
                  const originalBoardObjectRef = this.boardsBeforeDrag[task.column];

                  const newIndex = this.boards.findIndex(b =>
                      // Using a more robust check if board objects might be cloned or if titles/themeIds are unique identifiers
                      (originalBoardObjectRef.title === b.title && originalBoardObjectRef.themeId === b.themeId) || b === originalBoardObjectRef
                  );

                  if (newIndex !== -1) {
                      if (task.column !== newIndex) {
                          task.column = newIndex;
                          tasksModified = true;
                      }
                  } else {
                      console.warn(`BoardManager: Board reference for task ${task.id} (original column ${task.column}, title "${originalBoardObjectRef ? originalBoardObjectRef.title : 'N/A'}") not found in new board order. Task column not remapped.`);
                  }
              } else {
                   console.warn(`BoardManager: Task ${task.id} has an invalid or out-of-bounds original column index: ${task.column}. Cannot reliably remap.`);
              }
          });

          if (tasksModified) {
              useTaskStore.getState().setAllTasks(allTasks); // Update the store with re-mapped tasks
          }
          this.boardsBeforeDrag = null; // Clear the snapshot
      } else {
          console.error("BoardManager: boardsBeforeDrag was not set. Task columns cannot be remapped.");
      }
      // === END NEW TASK COLUMN RE-MAPPING LOGIC ===

      // Re-render all boards.
      if (this.uiManager && this.taskManager && this.dragDropManager) {
          this.renderBoards(this.uiManager, this.taskManager, this.dragDropManager);
      }
    });
    this.boardDragDropInitialized = true;
  }

  /**
   * Opens the modal to edit board details.
   * @param {number} index - Index of the board to edit.
   * @param {number} index - Index of the board to edit.
   */
  openEditBoardModal(index) {
    this.editBoardModal = document.getElementById('edit-board-modal');
    this.boardNameInput = document.getElementById('board-name-input');
    this.boardColorInput = document.getElementById('board-color-input');
    this.editBoardForm = document.getElementById('edit-board-form');

    if (!this.editBoardModal || !this.boardNameInput || !this.boardColorInput || !this.editBoardForm) {
      console.error('Edit board modal elements not found.');
      return;
    }

    this.currentBoardIndex = index;
    this.boardNameInput.value = this.boards[index].title;
    this.boardColorInput.value = this.boards[index].color;

    this.editBoardModal.classList.remove('hidden');
    this.editBoardModal.classList.add('flex');

    this.editBoardForm.onsubmit = e => {
      e.preventDefault();
      this.updateBoard(index);
    };
  }

  /**
   * Hides the board edit modal.
   */
  hideEditBoardModal() {
    this.editBoardModal = document.getElementById('edit-board-modal');
    if (this.editBoardModal) {
      this.editBoardModal.classList.add('hidden');
      this.editBoardModal.classList.remove('flex');
    }
  }

  /**
   * Updates board details based on user input.
   * @param {number} index - Index of the board to update.
   * @returns {boolean} True if the update was successful.
   */
  updateBoard(index) {
    this.boards[index] = {
      title: this.boardNameInput.value,
      color: this.boardColorInput.value,
    };
    this.saveBoards();
    this.hideEditBoardModal();

    if (this.uiManager && this.taskManager && this.dragDropManager) {
      this.renderBoards(this.uiManager, this.taskManager, this.dragDropManager);
    }
    return true;
  }

  /**
   * Deletes a board and updates related tasks.
   * @param {number} index - Index of the board to delete.
   * @param {Object} taskManager - Task Manager instance.
   * @returns {boolean} True if the board was deleted.
   */
  deleteBoard(index, taskManager) {
    if (!confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
      return false;
    }

    // Remove the board.
    this.boards.splice(index, 1);
    this.saveBoards();

    // Update tasks: remove tasks from the deleted board and adjust indices.
    const tasks = taskManager.getTasks();
    const updatedTasks = tasks.filter(task => task.column !== index);
    updatedTasks.forEach(task => {
      if (task.column > index) {
        task.column -= 1;
      }
    });
    taskManager.setTasks(updatedTasks);
    taskManager.saveTasks();

    return true;
  }

  /**
   * Clears all tasks in the currently active board.
   * @param {Object} taskManager - Task Manager instance.
   * @returns {boolean} True if tasks were cleared, false otherwise.
   */
  clearBoard(taskManager) {
    if (this.currentBoardIndex !== null) {
      const tasks = taskManager.getTasks();
      const updatedTasks = tasks.filter(task => task.column !== this.currentBoardIndex);
      taskManager.setTasks(updatedTasks);
      taskManager.saveTasks();
      this.hideEditBoardModal();
      return true;
    }
    return false;
  }

  /**
   * Displays a modal for sorting tasks.
   * @param {number} boardIndex - Index of the board.
   * @param {Object} taskManager - Task Manager instance.
   */
  showSortOptions(boardIndex, taskManager) {
    const sortModal = document.createElement('div');
    sortModal.className =
      'fixed inset-0 bg-black/20 bg-opacity-50 flex items-center justify-center z-50';
    sortModal.innerHTML = `
      <div class="bg-white dark:bg-[#121617] rounded-lg p-6 max-w-md w-full">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Sort Tasks</h3>
        <div class="relative w-full mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort by</label>
          <div class="relative w-full">
            <select
              id="sort-by"
              class="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-[#202227] dark:text-white dark:focus:ring-indigo-400"
            >
              <option value="priority">Priority</option>
              <option value="dueDate">Due Date</option>
              <option value="title">Title</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg
                class="h-4 w-4 text-gray-500 dark:text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
        <div class="relative w-full mb-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Direction</label>
          <div class="relative w-full">
            <select
              id="sort-direction"
              class="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-[#202227] dark:text-white dark:focus:ring-indigo-400"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg
                class="h-4 w-4 text-gray-500 dark:text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
        <div class="flex justify-end space-x-3">
          <button id="cancel-sort" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-[#202227] dark:text-gray-300 dark:hover:bg-gray-600">Cancel</button>
          <button id="apply-sort" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">Apply</button>
        </div>
      </div>
    `;
    document.body.appendChild(sortModal);
    // Attach event listeners for modal actions.
    sortModal.querySelector('#cancel-sort')?.addEventListener('click', () => sortModal.remove());
    sortModal.querySelector('#apply-sort')?.addEventListener('click', () => {
      const sortBy = sortModal.querySelector('#sort-by')?.value;
      const direction = sortModal.querySelector('#sort-direction')?.value;
      if (sortBy && direction) {
        taskManager.sortTasks(boardIndex, sortBy, direction);
      }
      sortModal.remove();
    });
  }

  /**
   * Calculates and returns a contrasting text color based on the background color.
   * @param {string} color - The background hex color code.
   * @returns {string} A hex color code for contrasting text.
   */
  getContrastingText(color) {
    let hex = color.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(x => x + x).join('');
    }
    const r = Number.parseInt(hex.substring(0, 2), 16);
    const g = Number.parseInt(hex.substring(2, 4), 16);
    const b = Number.parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 186 ? '#1f2937' : '#f9fafb';
  }
}

export default BoardManager;
