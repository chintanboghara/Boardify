import BoardManager from './modules/board-manager.js';
import DragDropManager from './modules/drag-drop-manager.js';
import SearchManager from './modules/search-manager.js';
import TaskManager from './modules/task-manager.js';
import ThemeManager from './modules/theme-manager.js';
import UIManager from './modules/ui-manager.js';

class Boardify {
  constructor() {
    this.boardManager = new BoardManager();
    this.dragDropManager = new DragDropManager();
    this.taskManager = new TaskManager(this.dragDropManager);
    this.themeManager = new ThemeManager();
    this.uiManager = new UIManager(
      this.boardManager,
      this.taskManager,
      this.dragDropManager,
    );
    this.searchManager = new SearchManager(this.taskManager, this.uiManager);
  }

  init() {
    this.cacheDOM();
    this.themeManager.initTheme();
    this.attachGlobalEvents();
    this.searchManager.attachSearchEvents();
    this.boardManager.renderBoards(
      this.uiManager,
      this.taskManager,
      this.dragDropManager,
    );
  }

  cacheDOM() {
    this.themeManager.cacheDOM();
    this.uiManager.cacheDOM();
    this.searchManager.cacheDOM();
  }

  attachGlobalEvents() {
    this.themeManager.attachEvents();
    this.uiManager.attachGlobalEvents();
  }

  autoScrollOnDrag(event) {
    this.dragDropManager.autoScrollOnDrag(event);
  }
}

export default Boardify;
