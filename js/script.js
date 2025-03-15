import Boardify from './broadify';

// Wait for the DOM to fully load before initializing the Boardify app.
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Instantiate and initialize the Boardify application.
    const app = new Boardify();
    app.init();

    // Enable auto-scrolling during drag operations.
    document.addEventListener('dragover', (event) => {
      event.preventDefault();
      // Ensure the autoScrollOnDrag method exists before calling it.
      if (typeof app.autoScrollOnDrag === 'function') {
        app.autoScrollOnDrag(event);
      }
    });
  } catch (error) {
    console.error("Failed to initialize Boardify app:", error);
  }
});
