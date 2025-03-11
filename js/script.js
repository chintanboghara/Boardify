// Main script to initialize the Boardify application.

import Boardify from './broadify';

document.addEventListener('DOMContentLoaded', () => {
  // Instantiate Boardify and initialize the app
  const app = new Boardify();
  app.init();

  // Listen for dragover events to enable auto-scrolling during drag operations
  document.addEventListener('dragover', (event) => {
    event.preventDefault();
    app.autoScrollOnDrag(event);
  });
});
