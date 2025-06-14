/**
 * Manages the search functionality for tasks.
 */
class SearchManager {
  /**
   * @param {Object} taskManager - Instance managing task operations.
   */
  constructor(taskManager) {
    this.taskManager = taskManager;
    this.searchInput = null;
    this.searchInputMob = null;
  }

  /**
   * Caches the DOM elements for both desktop and mobile search inputs.
   */
  cacheDOM() {
    this.searchInput = document.getElementById('search-input');
    this.searchInputMob = document.getElementById('search-input-mob');
  }

  /**
   * Attaches search event listeners to the input elements.
   * Filters tasks on input and clears the search on Escape key press.
   */
  attachSearchEvents() {
    // Helper function to attach events to a single input element.
    const attachToInput = (input) => {
      input.addEventListener('input', (e) => {
        this.taskManager.searchTasks(e.target.value);
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          input.value = '';
          this.taskManager.searchTasks(''); // Clears the search term and renders filtered (all) tasks
        }
      });
    };

    if (this.searchInput) {
      attachToInput(this.searchInput);
    }

    if (this.searchInputMob) {
      attachToInput(this.searchInputMob);
    }
  }
}

export default SearchManager;
