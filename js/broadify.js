import BoardManager from './modules/board-manager.js';
import DragDropManager from './modules/drag-drop-manager.js';
import SearchManager from './modules/search-manager.js';
import TaskManager from './modules/task-manager.js';
import ThemeManager from './modules/theme-manager.js';
import UIManager from './modules/ui-manager.js';

/**
 * Main application class for Boardify.
 * Coordinates board, task, theme, drag & drop, UI, and search operations.
 */
class Boardify {
  constructor() {
    // Initialize application modules.
    this.boardManager = new BoardManager();
    this.taskManager = new TaskManager();
    this.themeManager = new ThemeManager();
    this.dragDropManager = new DragDropManager(this.taskManager);
    this.uiManager = new UIManager(this.boardManager, this.taskManager, this.dragDropManager);
    this.searchManager = new SearchManager(this.taskManager, this.uiManager);

    // Create a placeholder element for task drag-and-drop interactions.
    this.taskPlaceholder = document.createElement('div');
    this.taskPlaceholder.className =
      'task-placeholder border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-md p-4 bg-gray-50 dark:bg-[#202227]';

    // Placeholder for a clone of a task element during drag operations.
    this.taskClone = null;
  }

  /**
   * Initializes the Boardify application.
   * Caches DOM elements, initializes theme, attaches global events,
   * sets up search functionality, and renders the boards.
   */
  init() {
    try {
      this.cacheDOM();
      this.themeManager.initTheme();
      this.attachGlobalEvents();
      this.searchManager.attachSearchEvents();
      this.boardManager.renderBoards(this.uiManager, this.taskManager, this.dragDropManager);
    } catch (error) {
      console.error('Error during Boardify initialization:', error);
    }
  }

  /**
   * Caches required DOM elements across modules.
   */
  cacheDOM() {
    this.themeManager.cacheDOM();
    this.uiManager.cacheDOM();
    this.searchManager.cacheDOM();
  }

  /**
   * Attaches global event listeners for theme and UI interactions.
   */
  attachGlobalEvents() {
    this.themeManager.attachEvents();
    this.uiManager.attachGlobalEvents();
  }

  /**
   * Delegates auto-scroll functionality during drag operations.
   * @param {DragEvent} event - The drag event.
   */
  autoScrollOnDrag(event) {
    if (this.dragDropManager && typeof this.dragDropManager.autoScrollOnDrag === 'function') {
      this.dragDropManager.autoScrollOnDrag(event);
    }
  }
}

export default Boardify;
