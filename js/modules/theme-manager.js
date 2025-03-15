/**
 * Manages theme switching between dark and light modes.
 */
class ThemeManager {
  constructor() {
    // DOM element references for theme toggle and icons.
    this.themeToggle = null;
    this.sunIcon = null;
    this.moonIcon = null;
  }

  /**
   * Caches required DOM elements.
   */
  cacheDOM() {
    this.themeToggle = document.getElementById('theme-toggle');
    this.sunIcon = document.getElementById('sun-icon');
    this.moonIcon = document.getElementById('moon-icon');

    if (!this.themeToggle) {
      console.warn('Theme toggle element not found.');
    }
    if (!this.sunIcon) {
      console.warn('Sun icon element not found.');
    }
    if (!this.moonIcon) {
      console.warn('Moon icon element not found.');
    }
  }

  /**
   * Attaches event listener for the theme toggle button.
   */
  attachEvents() {
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }
  }

  /**
   * Initializes the theme based on system preference or current state.
   */
  initTheme() {
    // Determine if user prefers dark mode.
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // Use the 'dark' class on the html element if it's already set or if the system prefers dark mode.
    const isDarkMode = document.documentElement.classList.contains('dark') || prefersDarkMode;

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      this.updateThemeIcon(true);
    } else {
      document.documentElement.classList.remove('dark');
      this.updateThemeIcon(false);
    }
  }

  /**
   * Toggles between dark and light themes.
   */
  toggleTheme() {
    const htmlElement = document.documentElement;
    const isDarkMode = htmlElement.classList.contains('dark');
    htmlElement.classList.toggle('dark');
    this.updateThemeIcon(!isDarkMode);
  }

  /**
   * Updates the theme toggle icons based on the active theme.
   * @param {boolean} isDarkMode - True if dark mode is active.
   */
  updateThemeIcon(isDarkMode) {
    if (this.sunIcon && this.moonIcon) {
      if (isDarkMode) {
        this.sunIcon.classList.remove('hidden');
        this.moonIcon.classList.add('hidden');
      } else {
        this.sunIcon.classList.add('hidden');
        this.moonIcon.classList.remove('hidden');
      }
    }
  }
}

export default ThemeManager;
