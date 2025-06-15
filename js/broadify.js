import BoardManager from './modules/board-manager.js';
import DragDropManager from './modules/drag-drop-manager.js';
import SearchManager from './modules/search-manager.js';
import TaskManager from './modules/task-manager.js';
import ThemeManager from './modules/theme-manager.js';
import UIManager from './modules/ui-manager.js';
import { useTaskStore } from './store/taskStore.js';

/**
 * Main application class for Boardify.
 * Coordinates board, task, theme, drag & drop, UI, and search operations.
 */
class Boardify {
  constructor(userId) { // Accept userId
    this.userId = userId; // Store userId

    // Initialize application modules, passing userId where needed.
    this.boardManager = new BoardManager(this.userId);
    // Pass boardManager to TaskManager constructor
    this.taskManager = new TaskManager(this.userId, this.boardManager);
    
    // Now that taskManager is initialized with userId, ensure default tasks are set up.
    // This is crucial for new users or guest sessions.
    this.taskManager.initializeDefaultTasksForUser();

    // BoardManager also needs a reference to taskManager to handle board deletions correctly (removing associated tasks).
    // And TaskManager might need boardManager for context (like checking if a board is "Done").
    // This creates a bit of a circular dependency in terms of initialization order if not handled carefully.
    // For now, we ensure BoardManager gets taskManager after taskManager is fully initialized.
    this.boardManager.taskManager = this.taskManager; 


    this.themeManager = new ThemeManager();
    this.dragDropManager = new DragDropManager(this.taskManager);
    // UIManager is created and gets taskManager and boardManager
    this.uiManager = new UIManager(this.boardManager, this.taskManager, this.dragDropManager); 
    this.taskManager.setUIManager(this.uiManager); // Set uiManager instance in taskManager
    this.boardManager.uiManager = this.uiManager; // Provide UIManager to BoardManager as well
    this.searchManager = new SearchManager(this.taskManager, this.uiManager);
    
    // Make boardManager globally available. This helps with TaskManager's renderTask logic
    // that currently uses window.boardManager. This should be refactored in the future
    // to avoid global access, perhaps by passing boardManager instance or relevant board data
    // to taskManager more directly when needed.
    // window.boardManager = this.boardManager; // Removed global assignment

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
      // After initial rendering, apply task styling.
      if (this.uiManager && typeof this.uiManager.applyTaskStyling === 'function') {
        this.uiManager.applyTaskStyling();
      }

      // Subscribe to task store changes to keep UI in sync
      useTaskStore.subscribe(
          (state, prevState) => {
              // Simple check: re-render if tasks array ref or length changes.
              // For more granular updates, specific property checks or a version/timestamp would be better.
              if (state.tasks !== prevState.tasks || state.tasks.length !== prevState.tasks.length) {
                  console.log("Task store changed, re-rendering all tasks on board via subscription.");
                  this.taskManager.renderAllTasks(); // This will use the new store data
              }
          }
      );

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
    this.uiManager.attachGlobalEvents(); // UIManager attaches its own global events

    // Add event listener for the export button
    if (this.uiManager && this.uiManager.exportDataBtn) {
      this.uiManager.exportDataBtn.addEventListener('click', () => this.exportData());
    }

    // Add event listeners for import button and file input
    if (this.uiManager && this.uiManager.importDataBtn && this.uiManager.importFileInput) {
      this.uiManager.importDataBtn.addEventListener('click', () => {
        this.uiManager.importFileInput.click(); // Trigger hidden file input
      });

      this.uiManager.importFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
          return;
        }
        if (file.type !== 'application/json') {
          alert("Import failed: Please select a valid JSON file.");
          event.target.value = null; // Reset file input
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonData = JSON.parse(e.target.result);
            this.importData(jsonData);
          } catch (error) {
            console.error("Error parsing imported JSON:", error);
            alert("Import failed: Could not parse the JSON file.");
          } finally {
            event.target.value = null; // Reset file input
          }
        };
        reader.onerror = () => {
          console.error("Error reading file for import.");
          alert("Import failed: Could not read the selected file.");
          event.target.value = null; // Reset file input
        };
        reader.readAsText(file);
      });
    }
    // Removed extra closing brace here
  }

  importData(jsonData) {
    // Basic validation
    if (!jsonData || typeof jsonData !== 'object' || !Array.isArray(jsonData.boards) || !Array.isArray(jsonData.tasks)) {
      console.error("Invalid data structure for import.", jsonData);
      alert("Import failed: Invalid file format or data structure.");
      return false;
    }

    // Confirmation from user (CRITICAL)
    if (!confirm("Importing will replace all current boards and tasks. Are you sure you want to proceed? This action cannot be undone.")) {
      return false;
    }

    try {
      this.boardManager.boards = jsonData.boards;
      // Use the setter to ensure reactivity or other logic in TaskManager is triggered
      this.taskManager.setTasks(jsonData.tasks);

      // Perform data migration for tasks
      // Access tasks via getTasks() if setTasks makes a deep copy or processes them
      this.taskManager.getTasks().forEach(task => {
        if (task.isArchived === undefined) {
          task.isArchived = false;
        }
        if (!Array.isArray(task.subtasks)) {
          task.subtasks = [];
        }
        if (!Array.isArray(task.activityLog)) {
          task.activityLog = [];
        }
        if (!Array.isArray(task.attachments)) {
          task.attachments = [];
        }
        // Add any other necessary migrations for task properties here
      });

      this.boardManager.saveBoards();
      // saveTasks is typically called by setTasks or other TaskManager methods internally if needed.
      // If setTasks directly updates the store and the store persists, this explicit call might be redundant
      // or even problematic if it saves an intermediate state.
      // For now, removing it as per request, assuming setTasks handles persistence or it's handled by boardManager.saveBoards() implicitly.

      alert("Data imported successfully! The application will now refresh to display the new data.");
      window.location.reload();

      return true;

    } catch (error) {
      console.error("Error importing data:", error);
      alert("Import failed. See console for details.");
      return false;
    }
  }

  exportData() {
    try {
      const dataToExport = {
        boards: this.boardManager.boards,
        tasks: this.taskManager.getTasks(),
        exportedAt: new Date().toISOString()
      };

      const jsonData = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');

      const date = new Date();
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      a.download = `boardify_data_${dateString}.json`;

      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("Data exported successfully.");
      // Optional: Show success notification via UIManager
      // if (this.uiManager && typeof this.uiManager.showNotification === 'function') {
      //   this.uiManager.showNotification('Data exported successfully!', 'success');
      // }

    } catch (error) {
      console.error("Error exporting data:", error);
      // Optional: Show error notification via UIManager
      // if (this.uiManager && typeof this.uiManager.showNotification === 'function') {
      //   this.uiManager.showNotification('Error exporting data. See console for details.', 'error');
      // }
    }
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

  handleKeyboardShortcuts(e) {
    const targetTagName = e.target.tagName.toLowerCase();
    const isGeneralInputFocused = (targetTagName === 'input' && e.target.type !== 'checkbox' && e.target.type !== 'radio' && e.target.type !== 'button' && e.target.type !== 'submit' && e.target.type !== 'color' && e.target.type !== 'file') ||
                                    targetTagName === 'textarea' ||
                                    e.target.isContentEditable;

    // Escape key - Universal close/cancel
    if (e.key === 'Escape') {
      // Check for active modals first
      if (this.uiManager && this.uiManager.taskModal && !this.uiManager.taskModal.classList.contains('hidden')) {
        this.taskManager.hideTaskModal();
        e.preventDefault();
        return;
      }
      if (this.uiManager && this.uiManager.editBoardModal && !this.uiManager.editBoardModal.classList.contains('hidden')) {
        this.boardManager.hideEditBoardModal();
        e.preventDefault();
        return;
      }
      if (this.uiManager && this.uiManager.archivedTasksModal && !this.uiManager.archivedTasksModal.classList.contains('hidden')) {
        this.uiManager.hideArchivedTasksModal();
        e.preventDefault();
        return;
      }

      const searchInput = this.uiManager.searchInput;
      const searchInputMob = this.uiManager.searchInputMob;

      if (document.activeElement === searchInput && searchInput.value) {
        searchInput.value = '';
        this.taskManager.searchTasks('');
        e.preventDefault();
        return;
      }
      if (document.activeElement === searchInputMob && searchInputMob.value) {
        searchInputMob.value = '';
        this.taskManager.searchTasks('');
        e.preventDefault();
        return;
      }
      if (document.activeElement === searchInput || document.activeElement === searchInputMob) {
          document.activeElement.blur();
          e.preventDefault();
          return;
      }
      return;
    }

    // Ctrl+Enter or Cmd+Enter for saving task in modal - This is now handled by TaskModalComponent
    // if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    //   if (this.uiManager && this.uiManager.taskModal && !this.uiManager.taskModal.classList.contains('hidden') &&
    //       this.uiManager.taskModal.contains(document.activeElement)) {
    //     // this.taskManager.handleTaskFormSubmit(); // Method removed
    //     e.preventDefault();
    //     return;
    //   }
    // }

    if (isGeneralInputFocused) {
      if (e.key === '/' && (targetTagName !== 'input' || e.target.type === 'search') && targetTagName !== 'textarea' && !e.target.isContentEditable) {
        // Allow / to proceed to focus search
      } else {
           return;
      }
    }

    // Shift+A: Add New Task
    if (e.shiftKey && e.key.toUpperCase() === 'A') {
      e.preventDefault();
      if (this.boardManager.boards && this.boardManager.boards.length > 0) {
        this.taskManager.openTaskModal(0);
      } else {
        if (typeof alert !== 'undefined') alert("Please add a board first before adding tasks.");
      }
      return;
    }

    // /: Focus Search
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      const searchInput = this.uiManager.searchInput;
      const searchInputMob = this.uiManager.searchInputMob;
      if (searchInput && (document.activeElement !== searchInput && document.activeElement !== searchInputMob)) {
        searchInput.focus();
      } else if (searchInputMob && (document.activeElement !== searchInput && document.activeElement !== searchInputMob)) {
        searchInputMob.focus();
      }
      return;
    }

    // Shift+V: View Archived Tasks
    if (e.shiftKey && e.key.toUpperCase() === 'V') {
      e.preventDefault();
      if (this.uiManager) this.uiManager.openArchivedTasksModal();
      return;
    }
  }
}

export default Boardify;
