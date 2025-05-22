// Simple placeholder for password hashing.
// IMPORTANT: In a real application, use a strong, salted hashing algorithm like bcrypt or Argon2.
// Never store plain text passwords.
const _simpleHash = (password) => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `hashed_${hash}`; // Prefix to indicate it's "hashed"
};

class AuthManager {
  constructor() {
    this.usersKey = 'boardify_users';
    this.sessionKey = 'boardify_session';
    this.users = JSON.parse(localStorage.getItem(this.usersKey)) || [];
  }

  _saveUsers() {
    localStorage.setItem(this.usersKey, JSON.stringify(this.users));
  }

  registerUser(username, password) {
    if (!username || !password) {
      return { success: false, message: 'Username and password are required.' };
    }
    const existingUser = this.users.find(user => user.username === username);
    if (existingUser) {
      return { success: false, message: 'Username already exists.' };
    }

    const passwordHash = _simpleHash(password);
    this.users.push({ username, passwordHash });
    this._saveUsers();

    // Automatically log in the user after registration
    return this.loginUser(username, password);
  }

  loginUser(username, password) {
    if (!username || !password) {
      return { success: false, message: 'Username and password are required.' };
    }
    const user = this.users.find(u => u.username === username);
    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    const passwordHash = _simpleHash(password);
    if (user.passwordHash !== passwordHash) {
      return { success: false, message: 'Invalid password.' };
    }

    // Store session (simple username for this example)
    localStorage.setItem(this.sessionKey, JSON.stringify({ username: user.username, userId: user.username })); // Using username as userId for simplicity
    return { success: true, message: 'Login successful.', user: { username: user.username, userId: user.username } };
  }

  logoutUser() {
    localStorage.removeItem(this.sessionKey);
    return { success: true, message: 'Logout successful.' };
  }

  getCurrentUser() {
    const session = localStorage.getItem(this.sessionKey);
    if (session) {
      try {
        return JSON.parse(session);
      } catch (e) {
        console.error("Error parsing session data:", e);
        this.logoutUser(); // Clear corrupted session
        return null;
      }
    }
    return null;
  }

  isLoggedIn() {
    return !!this.getCurrentUser();
  }
}

export default AuthManager;
