import TaskManager from '../js/modules/task-manager.js';
// Import DragDropManager to allow Jest to mock it.
// We don't use this import directly in the test, but Jest needs it for mocking the module.
import DragDropManager from '../js/modules/drag-drop-manager.js';

// Mock DragDropManager
// This mocks the module, so when TaskManager internally does `new DragDropManager()`,
// it gets this mocked version.
jest.mock('../js/modules/drag-drop-manager.js', () => {
  return jest.fn().mockImplementation(() => {
    return {
      handleDragStart: jest.fn(),
      handleTouchMove: jest.fn(),
      handleDragEnd: jest.fn(),
      setupDragAndDrop: jest.fn(), // Include if TaskManager calls this
    };
  });
});

// localStorage mock
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
    clear: jest.fn(() => { store = {}; }),
    removeItem: jest.fn((key) => { delete store[key]; }),
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// document mock
global.document = {
  getElementById: jest.fn((id) => ({
    value: '',
    reset: jest.fn(),
    dataset: {},
    querySelector: jest.fn(() => ({ textContent: '' })),
    classList: { add: jest.fn(), remove: jest.fn() }
  })),
  querySelectorAll: jest.fn(() => []), // Mock querySelectorAll to return an empty array
  // Add other document properties/methods if needed by the code under test
};

// confirm mock
global.confirm = jest.fn(() => true); // Default to true (e.g., for deleteTask)

describe('TaskManager', () => {
  let taskManager;
  let mockUIManager;

  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    
    document.getElementById.mockClear();
    document.querySelectorAll.mockClear();
    // If getElementById returns objects with methods, clear them too if necessary
    // e.g., if a specific element's reset method was called:
    // document.getElementById('task-form').reset.mockClear(); // but this needs careful handling of return values

    global.confirm.mockClear();

    // Create a fresh UIManager mock for each test
    mockUIManager = {
      applyTaskStyling: jest.fn(),
      // Mock other UIManager methods if TaskManager calls them
    };

    taskManager = new TaskManager('testUser1'); // Using a consistent userId for tests
    taskManager.setUIManager(mockUIManager);
    // TaskManager will instantiate its own DragDropManager, which will be the mocked version
    // due to jest.mock() at the top of the file.
    // No need to manually assign taskManager.dragDropManager if the module mock works as expected.
  });

  describe('Due Date Functionality', () => {
    it('Test 1.1: should have 1 task after adding one', () => {
      const dueDate1 = '2023-12-31';
      taskManager.addTask('Test Task 1', 'Description 1', 'high', dueDate1, 'Assignee 1', 0);
      const tasks = taskManager.getTasks();
      expect(tasks.length).toBe(1);
    });

    it('Test 1.2: should set the due date correctly for the added task', () => {
      const dueDate1 = '2023-12-31';
      taskManager.addTask('Test Task 1', 'Description 1', 'high', dueDate1, 'Assignee 1', 0);
      const tasks = taskManager.getTasks();
      expect(tasks[0].dueDate).toBe(dueDate1);
    });

    it('Test 2.1: should have 1 task after adding one without due date', () => {
      taskManager.addTask('Test Task 2', 'Description 2', 'medium', '', 'Assignee 2', 0); // Empty string for due date
      const tasks = taskManager.getTasks();
      expect(tasks.length).toBe(1);
    });

    it('Test 2.2: should have an empty string for due date if added with empty string', () => {
      taskManager.addTask('Test Task 2', 'Description 2', 'medium', '', 'Assignee 2', 0);
      const tasks = taskManager.getTasks();
      expect(tasks[0].dueDate).toBe('');
    });

    it('Test 2.3: should have 2 tasks after adding another with null due date', () => {
      taskManager.addTask('Test Task 2', 'Description 2', 'medium', '', 'Assignee 2', 0);
      taskManager.addTask('Test Task 3', 'Description 3', 'low', null, 'Assignee 3', 1); // null for due date
      const tasks = taskManager.getTasks();
      expect(tasks.length).toBe(2);
    });
    
    it('Test 2.4: should have null for due date if added with null', () => {
      taskManager.addTask('Test Task 3', 'Description 3', 'low', null, 'Assignee 3', 1);
      const tasks = taskManager.getTasks();
      // The original test expected null, ensure this is the behavior.
      // Depending on how TaskManager handles it, it might convert null to '' or store as null.
      // Based on original test: assertEquals(null, tasks2[1].dueDate, ...);
      expect(tasks[0].dueDate).toBe(null); 
    });

    it('Test 3.1: should update the due date of an existing task', () => {
      taskManager.addTask('Test Task 4', 'Description 4', 'high', '2023-01-01', 'Assignee 4', 0);
      let tasks = taskManager.getTasks();
      const taskId = tasks[0].id;
      const newDueDate = '2024-01-15';
      taskManager.updateTask(taskId, 'Updated Title 4', 'Updated Desc 4', 'low', newDueDate, 'New Assignee 4');
      tasks = taskManager.getTasks();
      expect(tasks[0].dueDate).toBe(newDueDate);
    });

    it('Test 3.2: should update other fields when updating due date', () => {
      taskManager.addTask('Test Task 4', 'Description 4', 'high', '2023-01-01', 'Assignee 4', 0);
      let tasks = taskManager.getTasks();
      const taskId = tasks[0].id;
      const newTitle = 'Updated Title 4';
      taskManager.updateTask(taskId, newTitle, 'Updated Desc 4', 'low', '2024-01-15', 'New Assignee 4');
      tasks = taskManager.getTasks();
      expect(tasks[0].title).toBe(newTitle);
    });

    it('Test 4.1: should retrieve the correct number of tasks', () => {
      const taskData1 = { title: 'Retrieve Task 1', dueDate: '2025-02-20', column: 0, priority: 'high', description: '', assignee: '' };
      const taskData2 = { title: 'Retrieve Task 2', dueDate: '', column: 0, priority: 'low', description: '', assignee: '' };
      taskManager.addTask(taskData1.title, taskData1.description, taskData1.priority, taskData1.dueDate, taskData1.assignee, taskData1.column);
      taskManager.addTask(taskData2.title, taskData2.description, taskData2.priority, taskData2.dueDate, taskData2.assignee, taskData2.column);
      
      const retrievedTasks = taskManager.getTasks();
      expect(retrievedTasks.length).toBe(2);
    });

    it('Test 4.2: should retrieve the correct due date for the first task', () => {
      const taskData1 = { title: 'Retrieve Task 1', dueDate: '2025-02-20', column: 0, priority: 'high', description: '', assignee: '' };
      taskManager.addTask(taskData1.title, taskData1.description, taskData1.priority, taskData1.dueDate, taskData1.assignee, taskData1.column);
      const retrievedTasks = taskManager.getTasks();
      const foundTask = retrievedTasks.find(t => t.title === taskData1.title);
      expect(foundTask.dueDate).toBe(taskData1.dueDate);
    });
    
    it('Test 4.3: should retrieve the correct (empty) due date for the second task', () => {
      const taskData2 = { title: 'Retrieve Task 2', dueDate: '', column: 0, priority: 'low', description: '', assignee: '' };
      taskManager.addTask(taskData2.title, taskData2.description, taskData2.priority, taskData2.dueDate, taskData2.assignee, taskData2.column);
      const retrievedTasks = taskManager.getTasks();
      const foundTask = retrievedTasks.find(t => t.title === taskData2.title);
      expect(foundTask.dueDate).toBe(taskData2.dueDate);
    });
  });

  describe('General Task Management', () => {
    it('should add a task and save it to localStorage', () => {
      taskManager.addTask('New Task', 'Desc', 'low', '', 'User', 0);
      expect(localStorageMock.setItem).toHaveBeenCalled();
      // Check if it was called with the user-specific key
      expect(localStorageMock.setItem).toHaveBeenCalledWith(expect.stringContaining('testUser1'), expect.any(String));
      const tasks = JSON.parse(localStorageMock.getItem(taskManager.tasksKey));
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe('New Task');
    });

    it('should delete a task after confirmation', () => {
      global.confirm.mockReturnValueOnce(true); // Ensure confirm returns true for this specific test
      taskManager.addTask('Task to Delete', 'Desc', 'medium', '', 'User', 0);
      let tasks = taskManager.getTasks();
      const taskId = tasks[0].id;
      
      taskManager.deleteTask(taskId);
      tasks = taskManager.getTasks();
      expect(tasks.length).toBe(0);
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2); // Once for add, once for delete
    });

    it('should not delete a task if confirmation is false', () => {
      global.confirm.mockReturnValueOnce(false); // Ensure confirm returns false
      taskManager.addTask('Task to Keep', 'Desc', 'medium', '', 'User', 0);
      let tasks = taskManager.getTasks();
      const taskId = tasks[0].id;

      taskManager.deleteTask(taskId);
      tasks = taskManager.getTasks();
      expect(tasks.length).toBe(1);
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1); // Only for add
    });

    it('should call UIManager.applyTaskStyling when saving tasks', () => {
      taskManager.addTask('Style Test Task', 'Desc', 'low', '', 'User', 0);
      // saveTasks is called by addTask
      expect(mockUIManager.applyTaskStyling).toHaveBeenCalled();
    });

    it('should initialize with default tasks if no tasks exist for the user', () => {
        localStorageMock.getItem.mockReturnValueOnce(null); // Simulate no tasks for user
        const tm = new TaskManager('newUserWithDefaults');
        tm.setUIManager(mockUIManager); // Set UIManager
        tm.initializeDefaultTasksForUser(); // Call the method that loads defaults
        
        const tasks = tm.getTasks();
        // Assuming defaultTasks is not empty
        expect(tasks.length).toBeGreaterThan(0); 
        // Check if default tasks were saved
        expect(localStorageMock.setItem).toHaveBeenCalledWith(`tasks_newUserWithDefaults`, JSON.stringify(tasks));
    });

    it('should use guest key if userId is null', () => {
        const guestTaskManager = new TaskManager(null); // Pass null for userId
        guestTaskManager.setUIManager(mockUIManager);
        guestTaskManager.addTask('Guest Task', 'Desc', 'low', '', '', 0);
        expect(localStorageMock.setItem).toHaveBeenCalledWith('tasks_guest', expect.any(String));
    });

    // Add more tests for searchTasks, renderFilteredTasks, sortTasks etc.
    // For render-heavy methods, you might only check if they call other services correctly
    // or if they manipulate the tasks array as expected, rather than asserting DOM changes.
  });

  // You might want a separate describe block for methods that heavily interact with the DOM
  // and require more detailed document.getElementById or querySelectorAll mocking.
  describe('DOM Interaction (Modal and Form)', () => {
    let mockTaskForm;
    let mockTaskModal;

    beforeEach(() => {
        mockTaskForm = {
            value: '',
            reset: jest.fn(),
            dataset: {}, // dataset.targetColumn will be set here
            // querySelector: jest.fn(() => ({ textContent: '' })) // Not needed if h3 is on modal
        };
        mockTaskModal = {
            classList: { add: jest.fn(), remove: jest.fn() },
            querySelector: jest.fn(() => ({ textContent: '' })) // For the h3
        };

        // Specific mocks for elements interacted with by modal methods
        document.getElementById.mockImplementation((id) => {
            if (id === 'task-modal') return mockTaskModal;
            if (id === 'task-form') return mockTaskForm;
            if (id === 'task-title') return { value: '' };
            if (id === 'task-description') return { value: '' };
            if (id === 'task-priority') return { value: 'low' };
            if (id === 'task-due-date') return { value: '' };
            if (id === 'task-assignee') return { value: '' };
            return null; 
        });
    });

    it('openTaskModal should show modal and populate for editing if task is provided', () => {
        const taskToEdit = { id: '1', title: 'Edit Me', description: 'My Desc', priority: 'high', dueDate: '2024-05-05', assignee: 'Dev' };
        taskManager.openTaskModal(0, taskToEdit);

        expect(document.getElementById).toHaveBeenCalledWith('task-modal');
        expect(mockTaskModal.classList.remove).toHaveBeenCalledWith('hidden');
        expect(mockTaskModal.classList.add).toHaveBeenCalledWith('flex');
        expect(mockTaskForm.dataset.targetColumn).toBe(0);
        expect(document.getElementById('task-title').value).toBe(taskToEdit.title); // Check if values are set
        expect(mockTaskModal.querySelector).toHaveBeenCalledWith('h3');
        // expect(mockTaskModal.querySelector().textContent).toBe('Edit Task'); // This requires the mock to return an object with textContent
    });

    it('openTaskModal should show modal and reset form if no task is provided (new task)', () => {
        taskManager.openTaskModal(1); // Open for new task in column 1

        expect(mockTaskModal.classList.remove).toHaveBeenCalledWith('hidden');
        expect(mockTaskModal.classList.add).toHaveBeenCalledWith('flex');
        expect(mockTaskForm.dataset.targetColumn).toBe(1);
        expect(mockTaskForm.reset).toHaveBeenCalled();
        // expect(mockTaskModal.querySelector().textContent).toBe('Add New Task');
    });
    
    it('hideTaskModal should hide the modal', () => {
        // First, ensure the modal is "open" (mocks are set up by openTaskModal)
        taskManager.openTaskModal(0);
        mockTaskModal.classList.remove.mockClear(); // Clear previous calls from openTaskModal
        mockTaskModal.classList.add.mockClear();

        taskManager.hideTaskModal();
        expect(mockTaskModal.classList.add).toHaveBeenCalledWith('hidden');
        expect(mockTaskModal.classList.remove).toHaveBeenCalledWith('flex');
    });

    it('handleTaskFormSubmit should add a new task if editingTaskId is null', () => {
        // Setup for adding a new task
        document.getElementById.mockImplementation(id => { // More refined mock for this test
            if (id === 'task-modal') return mockTaskModal;
            if (id === 'task-form') return { ...mockTaskForm, dataset: { targetColumn: '0' } }; // Ensure targetColumn is set
            if (id === 'task-title') return { value: 'New Form Task' };
            if (id === 'task-description') return { value: 'Form Desc' };
            if (id === 'task-priority') return { value: 'medium' };
            if (id === 'task-due-date') return { value: '2024-10-10' };
            if (id === 'task-assignee') return { value: 'Form User' };
            return null;
        });
        
        taskManager.openTaskModal(0); // This sets editingTaskId to null
        taskManager.handleTaskFormSubmit();

        const tasks = taskManager.getTasks();
        expect(tasks.length).toBe(1);
        expect(tasks[0].title).toBe('New Form Task');
        expect(tasks[0].column).toBe(0);
        expect(mockTaskModal.classList.add).toHaveBeenCalledWith('hidden'); // Modal hidden after submit
    });

    it('handleTaskFormSubmit should update an existing task if editingTaskId is set', () => {
        // Add a task first to be "edited"
        taskManager.addTask('Original Task', 'Orig Desc', 'high', '', '', 0);
        const taskToEdit = taskManager.getTasks()[0];

        document.getElementById.mockImplementation(id => {
            if (id === 'task-modal') return mockTaskModal;
            if (id === 'task-form') return { ...mockTaskForm, dataset: { targetColumn: taskToEdit.column.toString() } };
            if (id === 'task-title') return { value: 'Updated Form Task' };
            if (id === 'task-description') return { value: 'Updated Desc' };
            if (id === 'task-priority') return { value: 'low' };
            if (id === 'task-due-date') return { value: '2024-11-11' };
            if (id === 'task-assignee') return { value: 'Updated User' };
            return null;
        });

        taskManager.openTaskModal(taskToEdit.column, taskToEdit); // This sets editingTaskId
        taskManager.handleTaskFormSubmit();

        const tasks = taskManager.getTasks();
        expect(tasks.length).toBe(1);
        expect(tasks[0].id).toBe(taskToEdit.id);
        expect(tasks[0].title).toBe('Updated Form Task');
        expect(tasks[0].priority).toBe('low');
        expect(mockTaskModal.classList.add).toHaveBeenCalledWith('hidden');
    });

     it('handleTaskFormSubmit should alert if title is empty', () => {
        global.alert = jest.fn(); // Mock alert

        document.getElementById.mockImplementation(id => {
            if (id === 'task-modal') return mockTaskModal;
            if (id === 'task-form') return { ...mockTaskForm, dataset: { targetColumn: '0' } };
            if (id === 'task-title') return { value: '' }; // Empty title
            // ... other fields can be valid
            if (id === 'task-description') return { value: 'Form Desc' };
            if (id === 'task-priority') return { value: 'medium' };
            if (id === 'task-due-date') return { value: '2024-10-10' };
            if (id === 'task-assignee') return { value: 'Form User' };
            return null;
        });
        
        taskManager.openTaskModal(0);
        taskManager.handleTaskFormSubmit();

        expect(global.alert).toHaveBeenCalledWith('Task title cannot be empty.');
        expect(taskManager.getTasks().length).toBe(0); // No task should be added
        expect(mockTaskModal.classList.add).not.toHaveBeenCalledWith('hidden'); // Modal should remain open

        global.alert.mockRestore(); // Clean up alert mock
    });
  });

  describe('Task Priority and Sorting', () => {
    it('should save priority correctly when adding a task', () => {
      taskManager.addTask('Priority Task 1', 'Desc', 'high', '', 'User', 0);
      const tasks = taskManager.getTasks();
      expect(tasks[0].priority).toBe('high');
    });

    it('should update priority correctly when updating a task', () => {
      taskManager.addTask('Priority Task 2', 'Desc', 'low', '', 'User', 0);
      let tasks = taskManager.getTasks();
      const taskId = tasks[0].id;
      taskManager.updateTask(taskId, 'Updated Priority Task 2', 'Updated Desc', 'high', '', 'User');
      tasks = taskManager.getTasks();
      expect(tasks[0].priority).toBe('high');
    });

    it('getPriorityClass should return correct class for "high"', () => {
      expect(taskManager.getPriorityClass('high')).toBe('bg-rose-300 dark:bg-rose-500 text-gray-800 dark:text-white');
    });

    it('getPriorityClass should return correct class for "medium"', () => {
      expect(taskManager.getPriorityClass('medium')).toBe('bg-amber-300 dark:bg-amber-500 text-gray-800 dark:text-white');
    });

    it('getPriorityClass should return correct class for "low"', () => {
      expect(taskManager.getPriorityClass('low')).toBe('bg-green-300 dark:bg-green-500 text-gray-800 dark:text-white');
    });

    it('getPriorityClass should return default class for unknown priority', () => {
      expect(taskManager.getPriorityClass('unknown')).toBe('bg-green-300 dark:bg-green-500 text-gray-800 dark:text-white'); // Default is low
    });

    describe('sortTasks by priority', () => {
      beforeEach(() => {
        // Clear tasks before each sort test to ensure a clean slate
        taskManager.tasks = []; 
        taskManager.saveTasks(); 
      });

      it('should sort tasks by priority in descending order', () => {
        taskManager.addTask('Task A Low', 'Desc', 'low', '', 'User', 0);
        taskManager.addTask('Task B High', 'Desc', 'high', '', 'User', 0);
        taskManager.addTask('Task C Medium', 'Desc', 'medium', '', 'User', 0);
        
        taskManager.sortTasks(0, 'priority', 'desc');
        const tasks = taskManager.getTasks().filter(t => t.column === 0);
        
        expect(tasks.length).toBe(3);
        expect(tasks[0].title).toBe('Task B High'); // High
        expect(tasks[1].title).toBe('Task C Medium'); // Medium
        expect(tasks[2].title).toBe('Task A Low'); // Low
      });

      it('should sort tasks by priority in ascending order', () => {
        taskManager.addTask('Task A Low', 'Desc', 'low', '', 'User', 0);
        taskManager.addTask('Task B High', 'Desc', 'high', '', 'User', 0);
        taskManager.addTask('Task C Medium', 'Desc', 'medium', '', 'User', 0);

        taskManager.sortTasks(0, 'priority', 'asc');
        const tasks = taskManager.getTasks().filter(t => t.column === 0);

        expect(tasks.length).toBe(3);
        expect(tasks[0].title).toBe('Task A Low'); // Low
        expect(tasks[1].title).toBe('Task C Medium'); // Medium
        expect(tasks[2].title).toBe('Task B High'); // High
      });

      it('should group tasks with the same priority together', () => {
        taskManager.addTask('Task A Low', 'Desc', 'low', '', 'User', 0);
        taskManager.addTask('Task B High', 'Desc', 'high', '', 'User', 0);
        taskManager.addTask('Task C Medium 1', 'Desc', 'medium', '', 'User', 0);
        taskManager.addTask('Task D Medium 2', 'Desc', 'medium', '', 'User', 0);
        taskManager.addTask('Task E High 2', 'Desc', 'high', '', 'User', 0);

        taskManager.sortTasks(0, 'priority', 'desc');
        const tasks = taskManager.getTasks().filter(t => t.column === 0);

        expect(tasks.length).toBe(5);
        expect(tasks[0].priority).toBe('high');
        expect(tasks[1].priority).toBe('high');
        expect(tasks[2].priority).toBe('medium');
        expect(tasks[3].priority).toBe('medium');
        expect(tasks[4].priority).toBe('low');
      });

      it('should only sort tasks in the specified boardIndex', () => {
        // Tasks in column 0
        taskManager.addTask('C0 Task A Low', 'Desc', 'low', '', 'User', 0);
        taskManager.addTask('C0 Task B High', 'Desc', 'high', '', 'User', 0);
        // Tasks in column 1 (should remain unsorted by priority call on column 0)
        taskManager.addTask('C1 Task X High', 'Desc', 'high', '', 'User', 1); // Will be first if tasks are just appended
        taskManager.addTask('C1 Task Y Low', 'Desc', 'low', '', 'User', 1);  // Will be second
        
        const initialTasksCol1 = taskManager.getTasks().filter(t => t.column === 1).map(t => t.title);

        taskManager.sortTasks(0, 'priority', 'desc');
        
        const tasksCol0 = taskManager.getTasks().filter(t => t.column === 0);
        const tasksCol1 = taskManager.getTasks().filter(t => t.column === 1).map(t => t.title);

        expect(tasksCol0.length).toBe(2);
        expect(tasksCol0[0].title).toBe('C0 Task B High');
        expect(tasksCol0[1].title).toBe('C0 Task A Low');

        expect(tasksCol1.length).toBe(2);
        // Check that order in column 1 is preserved
        expect(tasksCol1[0]).toBe(initialTasksCol1[0]); 
        expect(tasksCol1[1]).toBe(initialTasksCol1[1]);
      });
    });
  });

  describe('Subtask Management', () => {
    let parentTaskId;
    const initialTaskDetails = {
      title: 'Parent Task for Subtasks',
      description: 'Parent Description',
      priority: 'high',
      dueDate: '2024-12-31',
      assignee: 'Test User',
      columnIndex: 0
    };

    beforeEach(() => {
      // Add a parent task before each subtask test
      taskManager.addTask(
        initialTaskDetails.title,
        initialTaskDetails.description,
        initialTaskDetails.priority,
        initialTaskDetails.dueDate,
        initialTaskDetails.assignee,
        initialTaskDetails.columnIndex
      );
      const tasks = taskManager.getTasks();
      parentTaskId = tasks.find(t => t.title === initialTaskDetails.title).id;
      // Reset setItem mock calls for each specific subtask test, 
      // as addTask already calls it.
      localStorageMock.setItem.mockClear();
    });

    it('should add a subtask to a parent task', () => {
      const subtaskTitle = 'New Subtask Title';
      taskManager.addSubtask(parentTaskId, subtaskTitle);
      
      const parentTask = taskManager.getTasks().find(t => t.id === parentTaskId);
      expect(parentTask.subtasks).toBeDefined();
      expect(parentTask.subtasks.length).toBe(1);
      expect(parentTask.subtasks[0].title).toBe(subtaskTitle);
      expect(parentTask.subtasks[0].completed).toBe(false);
      expect(parentTask.subtasks[0].id).toMatch(/^sub_/); // Check if subtask ID has the prefix
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should edit an existing subtask', () => {
      const subtaskTitle = 'Initial Subtask';
      taskManager.addSubtask(parentTaskId, subtaskTitle);
      let parentTask = taskManager.getTasks().find(t => t.id === parentTaskId);
      const subtaskId = parentTask.subtasks[0].id;
      localStorageMock.setItem.mockClear(); // Clear after addSubtask's save

      const updatedSubtaskTitle = 'Updated Subtask Title';
      taskManager.editSubtask(parentTaskId, subtaskId, updatedSubtaskTitle);

      parentTask = taskManager.getTasks().find(t => t.id === parentTaskId);
      expect(parentTask.subtasks[0].title).toBe(updatedSubtaskTitle);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should toggle subtask completion status', () => {
      taskManager.addSubtask(parentTaskId, 'Toggle Me Subtask');
      let parentTask = taskManager.getTasks().find(t => t.id === parentTaskId);
      const subtaskId = parentTask.subtasks[0].id;
      localStorageMock.setItem.mockClear();

      // First toggle: false -> true
      taskManager.toggleSubtaskCompletion(parentTaskId, subtaskId);
      parentTask = taskManager.getTasks().find(t => t.id === parentTaskId);
      expect(parentTask.subtasks[0].completed).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);

      // Second toggle: true -> false
      taskManager.toggleSubtaskCompletion(parentTaskId, subtaskId);
      parentTask = taskManager.getTasks().find(t => t.id === parentTaskId);
      expect(parentTask.subtasks[0].completed).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
    });

    it('should delete a subtask from a parent task', () => {
      taskManager.addSubtask(parentTaskId, 'Subtask to Delete');
      taskManager.addSubtask(parentTaskId, 'Subtask to Keep');
      let parentTask = taskManager.getTasks().find(t => t.id === parentTaskId);
      const subtaskIdToDelete = parentTask.subtasks[0].id;
      const subtaskIdToKeep = parentTask.subtasks[1].id;
      localStorageMock.setItem.mockClear();

      taskManager.deleteSubtask(parentTaskId, subtaskIdToDelete);
      parentTask = taskManager.getTasks().find(t => t.id === parentTaskId);

      expect(parentTask.subtasks.length).toBe(1);
      expect(parentTask.subtasks.find(s => s.id === subtaskIdToDelete)).toBeUndefined();
      expect(parentTask.subtasks[0].id).toBe(subtaskIdToKeep);
      expect(parentTask.subtasks[0].title).toBe('Subtask to Keep');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    // Optional: Error Handling Tests
    describe('Error Handling for Subtasks', () => {
      let consoleErrorSpy;

      beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      });

      afterEach(() => {
        consoleErrorSpy.mockRestore();
      });

      it('should log an error when adding subtask to non-existent parent', () => {
        taskManager.addSubtask('nonExistentParentId', 'Subtask Title');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Parent task with ID nonExistentParentId not found.');
        expect(localStorageMock.setItem).not.toHaveBeenCalled();
      });

      it('should log an error when editing subtask of non-existent parent', () => {
        taskManager.editSubtask('nonExistentParentId', 'subId', 'New Title');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Parent task with ID nonExistentParentId not found.');
        expect(localStorageMock.setItem).not.toHaveBeenCalled();
      });
      
      it('should log an error when editing non-existent subtask', () => {
        taskManager.editSubtask(parentTaskId, 'nonExistentSubId', 'New Title');
        expect(consoleErrorSpy).toHaveBeenCalledWith(`Subtask with ID nonExistentSubId not found in parent task ${parentTaskId}.`);
        expect(localStorageMock.setItem).not.toHaveBeenCalled();
      });

      it('should log an error when toggling subtask of non-existent parent', () => {
        taskManager.toggleSubtaskCompletion('nonExistentParentId', 'subId');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Parent task with ID nonExistentParentId not found.');
        expect(localStorageMock.setItem).not.toHaveBeenCalled();
      });

      it('should log an error when toggling non-existent subtask', () => {
        taskManager.toggleSubtaskCompletion(parentTaskId, 'nonExistentSubId');
        expect(consoleErrorSpy).toHaveBeenCalledWith(`Subtask with ID nonExistentSubId not found in parent task ${parentTaskId}.`);
        expect(localStorageMock.setItem).not.toHaveBeenCalled();
      });

      it('should log an error when deleting subtask of non-existent parent', () => {
        taskManager.deleteSubtask('nonExistentParentId', 'subId');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Parent task with ID nonExistentParentId not found.');
        expect(localStorageMock.setItem).not.toHaveBeenCalled();
      });

      it('should not fail when deleting a non-existent subtask from an existing parent (filter handles this gracefully)', () => {
        taskManager.deleteSubtask(parentTaskId, 'nonExistentSubId');
        // No error message is explicitly logged in this case by the current implementation,
        // as filter simply won't find a match and the subtasks array remains unchanged or as is.
        // We can assert that console.error was NOT called for this specific scenario,
        // and that saveTasks was still called (as per current implementation).
        expect(consoleErrorSpy).not.toHaveBeenCalledWith(expect.stringContaining('nonExistentSubId'));
        expect(localStorageMock.setItem).toHaveBeenCalled(); // saveTasks is called even if subtask not found
      });
    });
  });

  describe('Activity Logging', () => {
    let taskId;
    const initialTaskDetails = {
      title: 'Log Test Task',
      description: 'Initial Description',
      priority: 'medium',
      dueDate: '2024-01-01',
      assignee: 'User Alpha',
      columnIndex: 0
    };

    beforeEach(() => {
      // Add a task before each test in this block
      taskManager.addTask(
        initialTaskDetails.title,
        initialTaskDetails.description,
        initialTaskDetails.priority,
        initialTaskDetails.dueDate,
        initialTaskDetails.assignee,
        initialTaskDetails.columnIndex
      );
      const tasks = taskManager.getTasks();
      // Find the task that was just added. Since tasks might be added by other tests,
      // we ensure we get the one for this test block.
      const currentTask = tasks.find(t => t.title === initialTaskDetails.title && t.activityLog.length === 1);
      taskId = currentTask.id;
      // Clear setItem mock calls for each specific activity log test
      localStorageMock.setItem.mockClear();
    });

    it('should log when a task is created', () => {
      const task = taskManager.getTasks().find(t => t.id === taskId);
      expect(task.activityLog).toBeDefined();
      expect(task.activityLog.length).toBe(1);
      expect(task.activityLog[0].type).toBe('TASK_CREATED');
      expect(task.activityLog[0].details).toBe('Task was created.');
      expect(task.activityLog[0].timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/);
      expect(task.activityLog[0].id).toEqual(expect.any(String));
    });

    it('should log when task fields are updated', () => {
      taskManager.updateTask(taskId, 'New Title', 'New Desc', 'high', '2025-01-01', 'New Assignee');
      const task = taskManager.getTasks().find(t => t.id === taskId);

      // Greater than 1 because of the initial TASK_CREATED log + 5 field updates
      expect(task.activityLog.length).toBe(1 + 5); 
      
      // Logs are prepended (newest first)
      expect(task.activityLog).toContainEqual(expect.objectContaining({ type: 'FIELD_UPDATED', details: `Title changed from "${initialTaskDetails.title}" to "New Title".` }));
      expect(task.activityLog).toContainEqual(expect.objectContaining({ type: 'FIELD_UPDATED', details: 'Description updated.' }));
      expect(task.activityLog).toContainEqual(expect.objectContaining({ type: 'FIELD_UPDATED', details: `Priority changed from "${initialTaskDetails.priority}" to "high".` }));
      expect(task.activityLog).toContainEqual(expect.objectContaining({ type: 'FIELD_UPDATED', details: `Due date changed from "${initialTaskDetails.dueDate}" to "2025-01-01".` }));
      expect(task.activityLog).toContainEqual(expect.objectContaining({ type: 'FIELD_UPDATED', details: `Assignee changed from "${initialTaskDetails.assignee}" to "New Assignee".` }));
    });

    it('should not log field updates if fields are not changed', () => {
      taskManager.updateTask(taskId, initialTaskDetails.title, initialTaskDetails.description, initialTaskDetails.priority, initialTaskDetails.dueDate, initialTaskDetails.assignee);
      const task = taskManager.getTasks().find(t => t.id === taskId);
      // Only the initial TASK_CREATED log should be present
      expect(task.activityLog.length).toBe(1); 
    });

    describe('Subtask Activity Logs', () => {
      let subtaskId;
      const subtaskTitle = 'My Test Subtask';

      beforeEach(() => {
        // Add a subtask for tests that need one
        taskManager.addSubtask(taskId, subtaskTitle);
        const parentTask = taskManager.getTasks().find(t => t.id === taskId);
        subtaskId = parentTask.subtasks[0].id;
        // Clear mocks after setup for subtask tests
        localStorageMock.setItem.mockClear(); 
      });

      it('should log when a subtask is added', () => {
        // The subtask was added in beforeEach, log was created there.
        // We need to check the log from that operation.
        // Re-add a subtask to make the test self-contained for this specific check or check existing log.
        const taskAfterInitialSubtaskAdd = taskManager.getTasks().find(t => t.id === taskId);
        // Expecting TASK_CREATED, and one SUBTASK_ACTIVITY for the subtask added in beforeEach
        expect(taskAfterInitialSubtaskAdd.activityLog.length).toBe(1 + 1); 
        expect(taskAfterInitialSubtaskAdd.activityLog[0]).toMatchObject({
          type: 'SUBTASK_ACTIVITY',
          details: `Subtask "${subtaskTitle}" added.`
        });
      });

      it('should log when a subtask title is edited', () => {
        const updatedSubtaskTitle = 'Updated Test Subtask';
        taskManager.editSubtask(taskId, subtaskId, updatedSubtaskTitle);
        const task = taskManager.getTasks().find(t => t.id === taskId);
        // TASK_CREATED, SUBTASK_ADDED (from beforeEach), SUBTASK_EDITED
        expect(task.activityLog.length).toBe(1 + 1 + 1); 
        expect(task.activityLog[0]).toMatchObject({
          type: 'SUBTASK_ACTIVITY',
          details: `Subtask "${subtaskTitle}" title changed to "${updatedSubtaskTitle}".`
        });
      });

      it('should log when subtask completion is toggled', () => {
        // Toggle 1: false -> true
        taskManager.toggleSubtaskCompletion(taskId, subtaskId);
        let task = taskManager.getTasks().find(t => t.id === taskId);
        expect(task.activityLog.length).toBe(1 + 1 + 1); // Created, Added, Toggled
        expect(task.activityLog[0]).toMatchObject({
          type: 'SUBTASK_ACTIVITY',
          details: `Subtask "${subtaskTitle}" marked as complete.`
        });

        localStorageMock.setItem.mockClear();
        // Toggle 2: true -> false
        taskManager.toggleSubtaskCompletion(taskId, subtaskId);
        task = taskManager.getTasks().find(t => t.id === taskId);
        expect(task.activityLog.length).toBe(1 + 1 + 1 + 1); // Created, Added, Toggled, Toggled
        expect(task.activityLog[0]).toMatchObject({
          type: 'SUBTASK_ACTIVITY',
          details: `Subtask "${subtaskTitle}" marked as incomplete.`
        });
      });

      it('should log when a subtask is deleted', () => {
        taskManager.deleteSubtask(taskId, subtaskId);
        const task = taskManager.getTasks().find(t => t.id === taskId);
        expect(task.activityLog.length).toBe(1 + 1 + 1); // Created, Added, Deleted
        expect(task.activityLog[0]).toMatchObject({
          type: 'SUBTASK_ACTIVITY',
          details: `Subtask "${subtaskTitle}" deleted.`
        });
      });
    });

    it('should log activities in the correct order (newest first)', () => {
      taskManager.updateTask(taskId, 'Updated Title Once', initialTaskDetails.description, initialTaskDetails.priority, initialTaskDetails.dueDate, initialTaskDetails.assignee);
      localStorageMock.setItem.mockClear();
      taskManager.updateTask(taskId, 'Updated Title Twice', initialTaskDetails.description, initialTaskDetails.priority, initialTaskDetails.dueDate, initialTaskDetails.assignee);
      
      const task = taskManager.getTasks().find(t => t.id === taskId);
      // TASK_CREATED, FIELD_UPDATED (title once), FIELD_UPDATED (title twice)
      expect(task.activityLog.length).toBe(3); 
      expect(task.activityLog[0].details).toBe(`Title changed from "Updated Title Once" to "Updated Title Twice".`);
      expect(task.activityLog[1].details).toBe(`Title changed from "${initialTaskDetails.title}" to "Updated Title Once".`);
      expect(task.activityLog[2].type).toBe('TASK_CREATED');
    });
  });
});

// Note: For renderTask and other DOM-heavy methods, you'd typically check:
// 1. If the correct data is passed to DOM element creation.
// 2. If event listeners are attached (can be tricky, often requires more specific mocking of addEventListener on the created elements).
// 3. If other services (like DragDropManager, UIManager) are called correctly.
// Testing the exact DOM output (innerHTML) can be brittle.
// The `renderAllTasks` and `renderFilteredTasks` call `renderTask` for each task.
// They also clear the task lists (document.querySelectorAll('.task-list').forEach(list => list.innerHTML = '')).
// The mock `document.querySelectorAll` returns an empty array, so this part won't cause errors.
// The `renderTask` method itself creates elements and appends them.
// The current `document.querySelectorAll` mock will prevent errors there.
// If actual DOM structure needs to be verified, a more complex setup like JSDOM or testing in a browser environment would be needed.
// The mock for DragDropManager ensures that `new DragDropManager(this)` inside renderTask gets a mock.
// The mock for UIManager ensures `this.uiManager.applyTaskStyling()` runs without error.
