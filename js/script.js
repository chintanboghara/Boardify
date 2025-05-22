import Boardify from './broadify';
import AuthManager from './modules/auth-manager';

// Wait for the DOM to fully load before initializing the Boardify app.
document.addEventListener('DOMContentLoaded', () => {
  const authManager = new AuthManager();

  // UI Elements for Auth
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const loginModal = document.getElementById('login-modal');
  const signupModal = document.getElementById('signup-modal');
  const closeLoginModalBtn = document.getElementById('close-login-modal');
  const closeSignupModalBtn = document.getElementById('close-signup-modal');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const userDisplay = document.getElementById('user-display');
  const userInfo = document.getElementById('user-info');

  // Function to update UI based on login state
  const updateUserUI = () => {
    const currentUser = authManager.getCurrentUser();
    if (currentUser) {
      loginBtn.classList.add('hidden');
      signupBtn.classList.add('hidden');
      logoutBtn.classList.remove('hidden');
      userDisplay.classList.remove('hidden');
      if (userInfo) {
        userInfo.textContent = currentUser.username;
      }
    } else {
      loginBtn.classList.remove('hidden');
      signupBtn.classList.remove('hidden');
      logoutBtn.classList.add('hidden');
      userDisplay.classList.add('hidden');
      if (userInfo) {
        userInfo.textContent = '';
      }
    }
  };

  // Initial UI update on page load
  updateUserUI();

  // Event Listeners for Modals
  if (loginBtn && loginModal && closeLoginModalBtn) {
    loginBtn.addEventListener('click', () => {
      loginModal.classList.remove('hidden');
      loginModal.classList.add('flex');
    });

    closeLoginModalBtn.addEventListener('click', () => {
      loginModal.classList.add('hidden');
      loginModal.classList.remove('flex');
    });

    loginModal.addEventListener('click', (event) => {
      if (event.target === loginModal) {
        loginModal.classList.add('hidden');
        loginModal.classList.remove('flex');
      }
    });
  }

  if (signupBtn && signupModal && closeSignupModalBtn) {
    signupBtn.addEventListener('click', () => {
      signupModal.classList.remove('hidden');
      signupModal.classList.add('flex');
    });

    closeSignupModalBtn.addEventListener('click', () => {
      signupModal.classList.add('hidden');
      signupModal.classList.remove('flex');
    });

    signupModal.addEventListener('click', (event) => {
      if (event.target === signupModal) {
        signupModal.classList.add('hidden');
        signupModal.classList.remove('flex');
      }
    });
  }

  // Event Listener for Logout Button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      const result = authManager.logoutUser();
      if (result.success) {
        updateUserUI();
        // Potentially clear board data or reload app for current user
        console.log(result.message);
        // Re-initialize Boardify or clear user-specific data
        // For now, let's reload the page to simplify state management
        window.location.reload();
      }
    });
  }

  // Event Listener for Login Form
  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const username = document.getElementById('login-email').value; // Assuming email field is used for username
      const password = document.getElementById('login-password').value;
      const result = authManager.loginUser(username, password);

      if (result.success) {
        updateUserUI();
        loginModal.classList.add('hidden');
        loginModal.classList.remove('flex');
        console.log(result.message);
        // Re-initialize Boardify for the logged-in user
        // For now, let's reload the page to simplify state management
        window.location.reload();
      } else {
        console.error('Login failed:', result.message);
        // Display error message to the user (e.g., in the modal)
        alert(`Login failed: ${result.message}`);
      }
    });
  }

  // Event Listener for Signup Form
  if (signupForm) {
    signupForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const username = document.getElementById('signup-email').value; // Assuming email field is used for username
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm-password').value;

      if (password !== confirmPassword) {
        console.error('Sign up error: Passwords do not match');
        alert('Sign up error: Passwords do not match');
        return;
      }

      const result = authManager.registerUser(username, password);

      if (result.success) {
        updateUserUI();
        signupModal.classList.add('hidden');
        signupModal.classList.remove('flex');
        console.log(result.message);
        // Re-initialize Boardify for the newly registered and logged-in user
        // For now, let's reload the page to simplify state management
        window.location.reload();
      } else {
        console.error('Sign up failed:', result.message);
        // Display error message to the user (e.g., in the modal)
        alert(`Sign up failed: ${result.message}`);
      }
    });
  }

  // Initialize Boardify Application
  // This needs to be aware of the current user for data scoping
  try {
    const currentUser = authManager.getCurrentUser();
    // Pass the currentUser (or userId) to Boardify constructor or init method
    const app = new Boardify(currentUser ? currentUser.userId : null);
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
