// js/store/taskStore.js
import { create } from 'zustand';
// import { persist, createJSONStorage } from 'zustand/middleware'; // Persist middleware not used directly for dynamic keys

// Assuming defaultTasks might be needed if initializing for a guest from scratch without specific user data.
// However, the main initialization will be from localStorage or an empty array for a new user.
// import { defaultTasks } from '../modules/constants.js'; // Not strictly needed if store always loads from LS or starts empty

const getTasksKey = (userId) => userId ? `tasks_${userId}` : 'tasks_guest';

// Helper for migrating individual tasks to ensure they have all necessary properties
const migrateTask = (task) => {
  const migrated = { ...task };
  if (typeof migrated.isArchived === 'undefined') {
    migrated.isArchived = false;
  }
  if (!Array.isArray(migrated.subtasks)) {
    migrated.subtasks = [];
  }
  if (!Array.isArray(migrated.activityLog)) {
    migrated.activityLog = [];
  }
  if (!Array.isArray(migrated.attachments)) {
    migrated.attachments = [];
  }
  // Add any other future migrations here
  return migrated;
};

export const useTaskStore = create((set, get) => ({
  tasks: [],
  currentUserId: null, // To store the current userId for persistence key

  // Action to initialize tasks for a given user
  // This should be called when the app starts or user logs in.
  loadTasksForUser: (userId) => {
    const tasksKey = getTasksKey(userId);
    const storedTasks = localStorage.getItem(tasksKey);
    let userTasks = [];
    if (storedTasks) {
      try {
        userTasks = JSON.parse(storedTasks).map(migrateTask);
      } catch (e) {
        console.error("Error parsing tasks from localStorage", e);
        userTasks = []; // Fallback to empty if parsing fails
      }
    } else {
      userTasks = [];
    }
    set({ tasks: userTasks, currentUserId: userId });
  },

  // Action to set all tasks (e.g., for data import or initial default setup)
  setAllTasks: (tasksToSet) => {
    const userId = get().currentUserId;
    // If no userId, we might be in a state where defaults for a guest are being set.
    // Or, if strict user-only data is required, this could warn/error.
    // For now, allow setting tasks even if userId is null (e.g. for guest or initial defaults before user context is fully set).
    const currentKeyOwner = userId || null; // Handles null for guest explicitly

    const migratedTasks = tasksToSet.map(migrateTask);
    localStorage.setItem(getTasksKey(currentKeyOwner), JSON.stringify(migratedTasks));
    set({ tasks: migratedTasks });
  },

  getTasks: () => get().tasks,

  addTask: (newTaskData) => {
    const userId = get().currentUserId;
    const currentKeyOwner = userId || null;

    const taskToAdd = migrateTask({
      ...newTaskData,
      id: newTaskData.id || Date.now().toString(),
      isArchived: typeof newTaskData.isArchived === 'boolean' ? newTaskData.isArchived : false,
      subtasks: newTaskData.subtasks || [],
      activityLog: newTaskData.activityLog || [],
      attachments: newTaskData.attachments || [],
    });

    set(state => {
      const updatedTasks = [...state.tasks, taskToAdd];
      localStorage.setItem(getTasksKey(currentKeyOwner), JSON.stringify(updatedTasks));
      return { tasks: updatedTasks };
    });
  },

  updateTask: (taskId, updates) => {
    const userId = get().currentUserId;
    const currentKeyOwner = userId || null;
    set(state => {
      const updatedTasks = state.tasks.map(task =>
        task.id === taskId ? migrateTask({ ...task, ...updates }) : task
      );
      localStorage.setItem(getTasksKey(currentKeyOwner), JSON.stringify(updatedTasks));
      return { tasks: updatedTasks };
    });
  },

  archiveTask: (taskId, archive = true) => {
    const userId = get().currentUserId;
    const currentKeyOwner = userId || null;
    set(state => {
      const updatedTasks = state.tasks.map(task =>
        task.id === taskId ? { ...task, isArchived: archive } : task
      );
      localStorage.setItem(getTasksKey(currentKeyOwner), JSON.stringify(updatedTasks));
      return { tasks: updatedTasks };
    });
  },

  deleteTask: (taskId) => {
    const userId = get().currentUserId;
    const currentKeyOwner = userId || null;
    set(state => {
      const updatedTasks = state.tasks.filter(task => task.id !== taskId);
      localStorage.setItem(getTasksKey(currentKeyOwner), JSON.stringify(updatedTasks));
      return { tasks: updatedTasks };
    });
  },

  getTaskById: (taskId) => {
    return get().tasks.find(task => task.id === taskId);
  },

  setTasksOrder: (orderedTasksArray) => {
    const userId = get().currentUserId;
    const currentKeyOwner = userId || null;
    // if (!userId) { // Decided to allow for guest or initial setup as per setAllTasks
    //   console.warn("Cannot set tasks order: currentUserId is not set in taskStore.");
    //   return;
    // }
    const migratedTasks = orderedTasksArray.map(task => migrateTask(task)); // Ensure all tasks conform
    localStorage.setItem(getTasksKey(currentKeyOwner), JSON.stringify(migratedTasks));
    set({ tasks: migratedTasks });
  },

  // Action to clear tasks, e.g., on logout for the current user profile
  clearUserTasks: () => {
    const userId = get().currentUserId;
    if (userId) { // Only clear if there was a specific user
        localStorage.removeItem(getTasksKey(userId));
    }
    // Also clear for guest if currentUserId was null
    else if (userId === null) {
        localStorage.removeItem(getTasksKey(null));
    }
    set({ tasks: [], currentUserId: null }); // Reset store state
  }
}));
