// Simple Assertion Helper
function assertEquals(expected, actual, message) {
  if (expected !== actual) {
    console.error(`Assertion Failed: ${message}`);
    console.error(`  Expected: ${expected}`);
    console.error(`  Actual:   ${actual}`);
    // In a real test runner, you'd throw an error here
    // throw new Error(`Assertion Failed: ${message}. Expected: ${expected}, Actual: ${actual}`);
  } else {
    console.log(`Assertion Passed: ${message}`);
  }
}

function assertDeepEquals(expected, actual, message) {
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    console.error(`Assertion Failed (deep): ${message}`);
    console.error(`  Expected: ${JSON.stringify(expected)}`);
    console.error(`  Actual:   ${JSON.stringify(actual)}`);
  } else {
    console.log(`Assertion Passed (deep): ${message}`);
  }
}

// Mocks
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem(key) {
      return store[key] || null;
    },
    setItem(key, value) {
      store[key] = value.toString();
    },
    clear() {
      store = {};
    },
    removeItem(key) {
      delete store[key];
    }
  };
})();

// Assign mock to global window object for TaskManager to pick up
global.localStorage = mockLocalStorage;
// Mock for document needed by TaskManager's openTaskModal, handleTaskFormSubmit, etc.
// For the focused tests, these might not be strictly necessary if not called.
global.document = {
  getElementById: (id) => {
    console.log(`Mock document.getElementById called with ${id}`);
    // Return a mock element with a value property if needed by the code path
    return { 
      value: '', 
      reset: () => {}, 
      dataset: {}, 
      querySelector: () => ({ textContent: ''}) ,
      classList: { add: () => {}, remove: () => {} }
    };
  },
  querySelectorAll: (selector) => {
    console.log(`Mock document.querySelectorAll called with ${selector}`);
    return []; // Return an empty array or mock elements as needed
  }
};
global.confirm = () => true; // Mock confirm for deleteTask

// Mock UIManager
const mockUIManager = {
  applyTaskStyling: () => {
    // console.log("Mock UIManager.applyTaskStyling called");
  }
};

// Mock DragDropManager
class MockDragDropManager {
  constructor(taskManager) {
    // console.log("MockDragDropManager instantiated");
    this.taskManager = taskManager;
  }
  handleDragStart() {}
  handleTouchMove() {}
  handleDragEnd() {}
  setupDragAndDrop() {}
}

// Dynamically import TaskManager AFTER mocks are set up
let TaskManager;

async function runTests() {
  try {
    const taskManagerModule = await import('../js/modules/task-manager.js');
    TaskManager = taskManagerModule.default;

    if (!TaskManager) {
      console.error("Failed to import TaskManager!");
      return;
    }

    console.log("TaskManager imported successfully.");

    // --- Test Suite ---
    console.log("--- Running TaskManager Due Date Tests ---");

    // Test 1: Adding a task with a due date
    mockLocalStorage.clear();
    let tm1 = new TaskManager();
    tm1.setUIManager(mockUIManager); // Set the mock UIManager
    tm1.dragDropManager = new MockDragDropManager(tm1); // Manually set mock DragDropManager
    
    const dueDate1 = '2023-12-31';
    tm1.addTask('Test Task 1', 'Description 1', 'high', dueDate1, 'Assignee 1', 0);
    let tasks1 = tm1.getTasks();
    assertEquals(1, tasks1.length, "Test 1.1: Number of tasks after adding one");
    assertEquals(dueDate1, tasks1[0].dueDate, "Test 1.2: Due date of added task");

    // Test 2: Adding a task without a due date (should default to empty or null)
    mockLocalStorage.clear();
    let tm2 = new TaskManager();
    tm2.setUIManager(mockUIManager);
    tm2.dragDropManager = new MockDragDropManager(tm2);

    tm2.addTask('Test Task 2', 'Description 2', 'medium', '', 'Assignee 2', 0); // Empty string for due date
    let tasks2 = tm2.getTasks();
    assertEquals(1, tasks2.length, "Test 2.1: Number of tasks after adding one without due date");
    assertEquals('', tasks2[0].dueDate, "Test 2.2: Due date should be empty string for task without due date");

    tm2.addTask('Test Task 3', 'Description 3', 'low', null, 'Assignee 3', 1); // null for due date
    tasks2 = tm2.getTasks();
    assertEquals(2, tasks2.length, "Test 2.3: Number of tasks after adding another without due date (null)");
    assertEquals(null, tasks2[1].dueDate, "Test 2.4: Due date should be null for task with null due date");


    // Test 3: Updating a task's due date
    mockLocalStorage.clear();
    let tm3 = new TaskManager();
    tm3.setUIManager(mockUIManager);
    tm3.dragDropManager = new MockDragDropManager(tm3);

    tm3.addTask('Test Task 4', 'Description 4', 'high', '2023-01-01', 'Assignee 4', 0);
    let tasks3 = tm3.getTasks();
    const taskId3 = tasks3[0].id;
    const newDueDate3 = '2024-01-15';
    tm3.updateTask(taskId3, 'Updated Title 4', 'Updated Desc 4', 'low', newDueDate3, 'New Assignee 4');
    tasks3 = tm3.getTasks();
    assertEquals(newDueDate3, tasks3[0].dueDate, "Test 3.1: Due date after update");
    assertEquals('Updated Title 4', tasks3[0].title, "Test 3.2: Title after update (verifying other fields not broken)");

    // Test 4: Retrieving tasks and verifying due date field
    mockLocalStorage.clear();
    let tm4 = new TaskManager();
    tm4.setUIManager(mockUIManager);
    tm4.dragDropManager = new MockDragDropManager(tm4);

    const taskData4_1 = { title: 'Retrieve Task 1', dueDate: '2025-02-20', column: 0, priority: 'high', description: '', assignee: '' };
    const taskData4_2 = { title: 'Retrieve Task 2', dueDate: '', column: 0, priority: 'low', description: '', assignee: '' };
    tm4.addTask(taskData4_1.title, taskData4_1.description, taskData4_1.priority, taskData4_1.dueDate, taskData4_1.assignee, taskData4_1.column);
    tm4.addTask(taskData4_2.title, taskData4_2.description, taskData4_2.priority, taskData4_2.dueDate, taskData4_2.assignee, taskData4_2.column);
    
    let retrievedTasks4 = tm4.getTasks();
    assertEquals(2, retrievedTasks4.length, "Test 4.1: Correct number of tasks retrieved");
    assertEquals(taskData4_1.dueDate, retrievedTasks4.find(t => t.title === taskData4_1.title).dueDate, "Test 4.2: Due date of first retrieved task");
    assertEquals(taskData4_2.dueDate, retrievedTasks4.find(t => t.title === taskData4_2.title).dueDate, "Test 4.3: Due date of second retrieved task (empty)");

    console.log("--- TaskManager Due Date Tests Finished ---");

  } catch (e) {
    console.error("Error during test execution:", e);
  }
}

// Run the tests
runTests();

// Note: This is a very basic test setup. A real testing framework (Jest, Mocha, etc.)
// would provide better structure, assertions, cleanup, and reporting.
// The dynamic import is used to ensure mocks are in place before TaskManager module loads.
// In a proper ES module test environment (like with Jest), imports are usually at the top.
// The 'global' object is used here for simplicity to mimic browser globals in a Node-like environment if these tests were run by Node.
// If run in a browser, 'window' would be the global object.
// The DragDropManager is also mocked because renderAllTasks (called by saveTasks) instantiates it.
// By providing a basic mock, we prevent errors if it's newed up.
// The tests focus on the data aspects of dueDate, avoiding calls to DOM-heavy methods like openTaskModal.
// saveTasks calls renderAllTasks, which calls renderTask, which does try to create DragDropManager.
// So, ensuring tm.dragDropManager is pre-assigned a mock helps.
// Also, tm.setUIManager(mockUIManager) is crucial as renderAllTasks calls uiManager.applyTaskStyling.

console.log("Test file created. Attempting to run tests...");
console.log("If TaskManager uses 'import DragDropManager from ...', the mock class MockDragDropManager defined here won't be used by it directly unless the module system is manipulated, which is beyond simple JS tests.");
console.log("The dynamic import of TaskManager is a trick for this environment. For robust testing, a proper test runner that handles ES modules and mocking (like Jest) is recommended.");
console.log("The current test mock DragDropManager by manually assigning to `this.dragDropManager` which TaskManager checks before creating a new one. This should work for these tests.");

// A more robust way to mock DragDropManager if it were imported by TaskManager:
// This would require a test runner that supports module mocking (e.g., Jest's jest.mock)
// jest.mock('../js/modules/drag-drop-manager.js', () => {
//   return {
//     __esModule: true, // This is important for ES modules
//     default: class MockDragDropManager {
//       constructor() { console.log("Mocked DragDropManager constructor"); }
//       setupDragAndDrop() { console.log("Mocked setupDragAndDrop"); }
//       // Add other methods that might be called
//     }
//   };
// });
