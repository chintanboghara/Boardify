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
}

export default UIManager;
