import {defaultBoards, defaultTasks} from './constants';

class BoardManager {
  constructor() {
    try {
      this.boards = JSON.parse(localStorage.getItem('boards')) || defaultBoards;
    } catch (error) {
      console.error('Error parsing boards from localStorage:', error);
      this.boards = defaultBoards; // Fallback to default boards
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

    this.uiManager = null;
    this.taskManager = null;
    this.dragDropManager = null;

    if (!localStorage.getItem('boards')) {
      this.saveBoards();
      this.initializeDefaultTasks();
    }
  }

  initializeDefaultTasks() {
    try {
      localStorage.setItem('tasks', JSON.stringify(defaultTasks));
    } catch (error) {
      console.error('Error saving default tasks to localStorage:', error);
    }
  }

  saveBoards() {
    try {
      localStorage.setItem('boards', JSON.stringify(this.boards));
    } catch (error) {
      console.error('Error saving boards to localStorage:', error);
    }
  }

  addNewBoard() {
    const boardTitle = prompt('Enter the name of the new board:');
    if (!boardTitle || boardTitle.trim() === '') {
      alert('Board name cannot be empty.');
      return;
    }
    const newBoard = {
      title: boardTitle.trim(),
      color: '#d1d5db',
    };
    this.boards.push(newBoard);
    this.saveBoards();
    return true;
  }

  renderBoards(uiManager, taskManager, dragDropManager) {
    // Store references to other managers for later use
    this.uiManager = uiManager;
    this.taskManager = taskManager;
    this.dragDropManager = dragDropManager;

    // Cache the main container for boards
    this.boardsContainer = document.querySelector('.board');
    if (!this.boardsContainer) return; // Exit if container not found

    // Clear existing boards to prevent duplication
    this.boardsContainer.innerHTML = '';

    // Loop through each board data and create its corresponding HTML element
    this.boards.forEach((board, index) => {
      const boardElement = document.createElement('div');
      // Basic styling and layout for a board column
      boardElement.className =
        'rounded-lg min-h-[74dvh] md:min-h-[78dvh] overflow-hidden flex flex-col w-[350px] xl:w-[400px] flex-shrink-0';
      // Dynamically generate HTML for the board header and task list area
      boardElement.innerHTML = `
        <header class="my-4">
          <div class="flex justify-between items-center flex-shrink-0 relative">
          <div>
            {/* Board title with dynamic background and text color for contrast */}
            <h3 style="background: ${board.color}; color: ${this.getContrastingText(board.color)}"
              class="font-semibold text-sm md:text-base px-2 py-1 rounded">
              ${board.title}
            </h3>
          </div>
            <div class="flex items-center space-x-2">
              {/* Button to add a new task to this board */}
              <button class="plus-btn cursor-pointer text-gray-700 dark:text-gray-200 hover:bg-white/20 dark:hover:bg-gray-700/ 20 p-1 rounded transition-colors" data-index="${index}" aria-label="Add new task to ${board.title} board">
                <i class="fas fa-plus text-sm"></i>
              </button>
              {/* Button to open board options (edit, delete, sort) */}
              <button class="board-options-btn cursor-pointer text-gray-700 dark:text-gray-200 hover:bg-white/20  dark:hover:bg-gray-700/20 p-1 rounded transition-colors" data-index="${index}" aria-label="Options for ${board.title} board">
                <i class="fas fa-ellipsis-h text-sm"></i>
              </button>
            {/* Dropdown menu for board options, initially hidden */}
            <div class="board-options-menu hidden absolute right-0 top-full mt-1 bg-white dark:bg-[#121617] rounded shadow-lg z-10 w-32 py-1" data-index="${index}">
              <button class="edit-board-btn w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" data-index="${index}" aria-label="Edit ${board.title} board details">
                <i class="fas fa-pencil-alt mr-2"></i> Edit
              </button>
              <button class="delete-board-btn w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" data-index="${index}" aria-label="Delete ${board.title} board">
                <i class="fas fa-trash mr-2"></i> Delete
              </button>
              <button class="sort-board-btn w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" data-index="${index}" aria-label="Sort tasks in ${board.title} board">
                <i class="fas fa-sort mr-2"></i> Sort
              </button>
            </div>
          </div>
        </div>
        </header>
        {/* Container where tasks for this board will be rendered */}
        <div class="task-list bg-gray-50 rounded-lg dark:bg-[#202227] flex-grow p-3 overflow-y-auto space-y-3 h-full" data-index="${index}"></div>
          {/* Footer button to add a new task to this board */}
          <div class="bg-gray-50 dark:bg-[#202227] flex-shrink-0 p-4">
            <button class="add-task-btn text-[14px] flex w-full cursor-pointer items-center justify-center gap-2 text-gray-600 transition-opacity duration-200 ease-in-out hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200" data-index="${index}">
          <i class="fas fa-plus text-[12px]"></i> Add Task
        </button>
      </div>
    `;
      // Append the newly created board element to the main container
      this.boardsContainer.appendChild(boardElement);
    });

    // Create and append the "Add New Board" button
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
      // When "Add New Board" is clicked, attempt to add a new board
      if (this.addNewBoard()) {
        // If successful, re-render all boards to show the new one
        this.renderBoards(uiManager, taskManager, dragDropManager);
      }
    });
    this.boardsContainer.appendChild(addBoardButton);

    // After all boards are rendered, attach necessary event listeners using UIManager
    // This centralizes event listener management.
    uiManager.attachBoardEventListeners(this, taskManager, dragDropManager);
    // Render all tasks, which will be distributed into their respective boards
    taskManager.renderAllTasks();
  }

  openEditBoardModal(index) {
    this.editBoardModal = document.getElementById('edit-board-modal');
    this.boardNameInput = document.getElementById('board-name-input');
    this.boardColorInput = document.getElementById('board-color-input');
    this.editBoardForm = document.getElementById('edit-board-form');

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

  hideEditBoardModal() {
    this.editBoardModal = document.getElementById('edit-board-modal');
    this.editBoardModal.classList.add('hidden');
    this.editBoardModal.classList.remove('flex');
  }

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

  deleteBoard(index, taskManager) {
    // Display a confirmation dialog before proceeding with deletion
    if (
      !confirm(
        'Are you sure you want to delete this board? This action cannot be undone.',
      )
    )
      return; // User cancelled the deletion

    // Remove the board from the boards array
    this.boards.splice(index, 1);
    this.saveBoards(); // Persist changes to localStorage

    // Update tasks associated with the deleted board
    const tasks = taskManager.getTasks();
    // Filter out tasks that belonged to the deleted column
    const updatedTasks = tasks.filter(task => task.column !== index);
    // Adjust column indices for tasks in columns that came after the deleted one
    updatedTasks.forEach(task => {
      if (task.column > index) {
        task.column -= 1; // Shift column index to the left
      }
    });
    taskManager.setTasks(updatedTasks); // Update tasks in TaskManager
    taskManager.saveTasks(); // Persist task changes

    return true; // Indicate successful deletion
  }

  clearBoard(taskManager) {
    if (this.currentBoardIndex !== null) {
      const tasks = taskManager.getTasks();
      const updatedTasks = tasks.filter(
        task => task.column !== this.currentBoardIndex,
      );
      taskManager.setTasks(updatedTasks);
      taskManager.saveTasks();
      this.hideEditBoardModal();
      return true;
    }
    return false;
  }

  // Displays a modal dialog to allow users to sort tasks within a specific board.
  showSortOptions(boardIndex, taskManager) {
    // Create the modal element
    const sortModal = document.createElement('div');
    // Apply styling for a full-screen overlay modal
    sortModal.className =
      'fixed inset-0 bg-black/20 bg-opacity-50 flex items-center justify-center z-50';
    // Populate modal with HTML for sort options (dropdowns for criteria and direction, action buttons)
    sortModal.innerHTML = `
      <div class="bg-white dark:bg-[#121617] rounded-lg p-6 max-w-md w-full">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Sort Tasks</h3>
       {/* Sort criteria dropdown */}
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
            {/* Dropdown arrow icon */}
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

        {/* Sort direction dropdown */}
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
            {/* Dropdown arrow icon */}
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
        {/* Action buttons: Cancel and Apply */}
        <div class="flex justify-end space-x-3">
          <button id="cancel-sort" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-[#202227] dark:text-gray-300 dark:hover:bg-gray-600">Cancel</button>
          <button id="apply-sort" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">Apply</button>
        </div>
      </div>
    `;
    // Append the modal to the body
    document.body.appendChild(sortModal);

    // Event listener for the "Cancel" button: removes the modal
    sortModal
      .querySelector('#cancel-sort')
      .addEventListener('click', () => sortModal.remove());

    // Event listener for the "Apply" button: gets sort preferences and calls TaskManager
    sortModal.querySelector('#apply-sort').addEventListener('click', () => {
      const sortBy = sortModal.querySelector('#sort-by').value;
      const direction = sortModal.querySelector('#sort-direction').value;
      taskManager.sortTasks(boardIndex, sortBy, direction); // Perform sorting
      sortModal.remove(); // Close modal after applying
    });
  }

  // Determines whether light or dark text provides better contrast against a given background color.
  getContrastingText(color) {
    // Remove '#' if present and handle 3-digit hex codes by duplicating digits (e.g., #RGB -> #RRGGBB)
    let hex = color.replace('#', '');
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map(x => x + x) // Duplicate each character (R -> RR, G -> GG, B -> BB)
        .join('');
    }
    // Convert hex to RGB integer components
    const r = Number.parseInt(hex.substring(0, 2), 16);
    const g = Number.parseInt(hex.substring(2, 4), 16);
    const b = Number.parseInt(hex.substring(4, 6), 16);

    // Calculate brightness using a standard formula (YIQ)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // Return dark text for light backgrounds (brightness > 186) and light text for dark backgrounds.
    // Color codes are for Tailwind CSS text colors (dark gray and light gray).
    return brightness > 186 ? '#1f2937' : '#f9fafb';
  }
}

export default BoardManager;
