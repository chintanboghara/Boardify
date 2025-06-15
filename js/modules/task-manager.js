import DragDropManager from './drag-drop-manager.js';

class TaskManager {
  constructor(dragDropManager) {
    this.dragDropManager = dragDropManager;
    try {
      this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    } catch (error) {
      console.error('Error parsing tasks from localStorage:', error);
      this.tasks = []; // Fallback to an empty array
    }
    this.filteredTasks = [...this.tasks];
    this.editingTaskId = null;
    this.taskModal = null;
    this.taskForm = null;
  }

  getTasks() {
    return this.tasks;
  }

  setTasks(tasks) {
    this.tasks = tasks;
    this.filteredTasks = [...tasks];
  }

  saveTasks() {
    try {
      localStorage.setItem('tasks', JSON.stringify(this.tasks));
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
    }
    this.renderAllTasks();
  }

  openTaskModal(index, task = null) {
    this.taskModal = document.getElementById('task-modal');
    this.taskForm = document.getElementById('task-form');

    this.taskModal.classList.remove('hidden');
    this.taskModal.classList.add('flex');

    this.taskForm.dataset.targetColumn = index;
    if (task) {
      this.editingTaskId = task.id;
      document.getElementById('task-title').value = task.title;
      document.getElementById('task-description').value =
        task.description || '';
      document.getElementById('task-priority').value = task.priority;
      document.getElementById('task-due-date').value = task.dueDate || '';
      document.getElementById('task-assignee').value = task.assignee || '';
      this.taskModal.querySelector('h3').textContent = 'Edit Task';
    } else {
      this.editingTaskId = null;
      this.taskForm.reset();
      this.taskModal.querySelector('h3').textContent = 'Add New Task';
    }
  }

  hideTaskModal() {
    this.taskModal = document.getElementById('task-modal');
    this.taskModal.classList.add('hidden');
    this.taskModal.classList.remove('flex');
  }

  // Handles the submission of the task form (for both adding new and editing existing tasks).
  handleTaskFormSubmit() {
    // Retrieve and trim values from the form fields
    const title = document.getElementById('task-title').value.trim();
    const description = document
      .getElementById('task-description')
      .value.trim();
    const priority = document.getElementById('task-priority').value;
    const dueDate = document.getElementById('task-due-date').value;
    const assignee = document.getElementById('task-assignee').value.trim();
    const columnIndex = Number.parseInt(this.taskForm.dataset.targetColumn, 10);

    // Basic validation: Ensure the task title is not empty.
    if (!title) {
      alert('Task title cannot be empty.');
      return;
    }

    // Check if we are editing an existing task (editingTaskId is set) or adding a new one.
    if (this.editingTaskId) {
      // If editing, call updateTask with the task's ID and new values.
      this.updateTask(
        this.editingTaskId,
        title,
        description,
        priority,
        dueDate,
        assignee,
      );
    } else {
      // If adding, call addTask with the new task's details and target column index.
      this.addTask(
        title,
        description,
        priority,
        dueDate,
        assignee,
        columnIndex,
      );
    }

    this.hideTaskModal(); // Close the task modal after submission.
  }

  addTask(title, description, priority, dueDate, assignee, columnIndex) {
    const newTask = {
      id: Date.now().toString(),
      title,
      description,
      priority,
      dueDate,
      assignee,
      column: columnIndex,
    };
    this.tasks.push(newTask);
    this.saveTasks();
  }

  updateTask(taskId, title, description, priority, dueDate, assignee) {
    const taskIndex = this.tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      this.tasks[taskIndex] = {
        ...this.tasks[taskIndex],
        title,
        description,
        priority,
        dueDate,
        assignee,
      };
      this.saveTasks();
    }
  }

  deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    const taskIndex = this.tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      this.tasks.splice(taskIndex, 1);
      this.saveTasks();
    }
  }

  // Filters tasks based on a search term.
  searchTasks(searchTerm) {
    // If the search term is empty or just whitespace, show all tasks.
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredTasks = [...this.tasks]; // Reset to all tasks
    } else {
      // Otherwise, filter tasks whose titles (case-insensitive) include the search term.
      searchTerm = searchTerm.toLowerCase().trim();
      this.filteredTasks = this.tasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm),
      );
    }
    this.renderFilteredTasks(); // Re-render the tasks based on the filter.
  }

  // Renders only the tasks that are currently in the `filteredTasks` array.
  renderFilteredTasks() {
    const taskLists = document.querySelectorAll('.task-list'); // Get all task list containers in the DOM.
    taskLists.forEach(list => (list.innerHTML = '')); // Clear all task lists.

    // Iterate over the filtered tasks and render each one in its respective column.
    this.filteredTasks.forEach(task => {
      const columnIndex = task.column;
      // Ensure the column index is valid before attempting to render.
      if (columnIndex >= 0 && columnIndex < taskLists.length) {
        this.renderTask(task, taskLists[columnIndex]); // Call renderTask for each filtered task.
      }
    });
  }

  renderAllTasks() {
    this.filteredTasks = [...this.tasks];
    const taskLists = document.querySelectorAll('.task-list');
    taskLists.forEach(list => (list.innerHTML = ''));
    this.tasks.forEach(task => {
      const columnIndex = task.column;
      if (columnIndex >= 0 && columnIndex < taskLists.length) {
        this.renderTask(task, taskLists[columnIndex]);
      }
    });
  }

  getPriorityClass(priority) {
    switch (priority) {
      case 'high':
        return 'bg-rose-300 dark:bg-rose-500 text-gray-800 dark:text-white';
      case 'medium':
        return 'bg-amber-300 dark:bg-amber-500 text-gray-800 dark:text-white';
      default:
        return 'bg-green-300 dark:bg-green-500 text-gray-800 dark:text-white';
    }
  }

  // Renders a single task element and appends it to the target column in the DOM.
  renderTask(task, targetColumn) {
    // Create the main div element for the task.
    const taskElement = document.createElement('div');
    // Apply CSS classes for styling, making it draggable, and setting its ID and dataset.
    taskElement.className =
      'task bg-white dark:bg-[#151A1C] rounded-md shadow-lg p-4 mt-1 flex flex-col hover:shadow-xl transition-shadow relative';
    taskElement.id = `task-${task.id}`; // Unique ID for the task element.
    taskElement.dataset.taskId = task.id; // Store task ID in dataset for easy access.
    taskElement.draggable = true; // Make the task element draggable.

    // Determine the priority class for styling the badge.
    const priorityClass = this.getPriorityClass(task.priority);

    // Populate the inner HTML of the task element with task details and action buttons.
    taskElement.innerHTML = `
      <div class="flex justify-between items-start mb-3">
        <h4 class="font-medium text-gray-900 dark:text-white text-lg">${task.title}</h4>
        <span class="priority-badge flex items-center justify-center text-sm px-3 py-1 rounded-md ${priorityClass}" data-priority="${task.priority}">
          ${task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Low'}
        </span>
      </div>
      <p class="text-gray-600 dark:text-gray-400 text-sm break-words line-clamp-3 mb-4">
        ${task.description || 'No description'}
      </p>
      ${task.dueDate ? `<p class="text-gray-600 dark:text-gray-400 text-sm">Due: ${task.dueDate}</p>` : ''}
      ${task.assignee ? `<p class="text-gray-600 dark:text-gray-400 break-words line-clamp-3 text-sm">Assignee: ${task.assignee}</p>` : ''}
      <div class="flex justify-end space-x-2">
        {/* Edit button for the task */}
        <button class="edit-task-btn p-2 text-gray-700 rounded-md transition-all hover:bg-white/20 dark:text-gray-300" data-task-id="${task.id}" aria-label="Edit task ${task.title}">
          <i class="fas fa-pencil-alt text-sm"></i>
        </button>
        {/* Delete button for the task */}
        <button class="delete-task-btn p-2 text-gray-700 rounded-md transition-all hover:bg-white/20 dark:text-gray-300" data-task-id="${task.id}" aria-label="Delete task ${task.title}">
          <i class="fas fa-trash text-sm"></i>
        </button>
      </div>
    `;
    // Append the newly created task element to its designated column.
    targetColumn.appendChild(taskElement);

    // Variables to store initial touch coordinates for differentiating click/tap from drag.
    let touchStartY = 0;
    let touchStartX = 0;

    // Event listener for drag start (mouse).
    // Delegates drag handling to DragDropManager.
    taskElement.addEventListener('dragstart', e => {
      this.dragDropManager.handleDragStart(e, taskElement);
    });

    // Event listener for touch start (mobile).
    // Records start coordinates and initiates drag after a short delay if touch hasn't moved much (to allow for taps).
    taskElement.addEventListener('touchstart', e => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      setTimeout(() => {
        // Check if touch has moved significantly; if not, consider it a drag start.
        if (
          Math.abs(e.touches[0].clientY - touchStartY) < 10 &&
          Math.abs(e.touches[0].clientX - touchStartX) < 10
        ) {
          this.dragDropManager.handleDragStart(e, taskElement);
        }
      }, 200); // 200ms delay to differentiate tap from drag.
    });

    // Event listener for touch move (mobile).
    // If the element is being dragged, prevent default scroll and update position via DragDropManager.
    taskElement.addEventListener('touchmove', e => {
      if (taskElement.classList.contains('dragging')) {
        e.preventDefault(); // Prevent page scrolling during task drag.
        this.dragDropManager.handleTouchMove(e, taskElement);
      }
    });

    // Event listener for touch end (mobile).
    // Handles the drop logic for touch devices.
    taskElement.addEventListener('touchend', e => {
      if (taskElement.classList.contains('dragging')) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        // Determine the element under the touch point to find the target column.
        const elemBelow = document.elementFromPoint(
          touch.clientX,
          touch.clientY,
        );
        const column = elemBelow.closest('.task-list'); // Find the closest task list (column).
        if (column) {
          // If a valid column is found, update the task's column index.
          const taskId = taskElement.dataset.taskId;
          const taskIndex = this.tasks.findIndex(task => task.id === taskId);
          if (taskIndex !== -1) {
            const newColumnIndex = Number.parseInt(column.dataset.index, 10);
            this.tasks[taskIndex].column = newColumnIndex;
            taskElement.remove(); // Remove task from old position.
            column.appendChild(taskElement); // Append to new column.
            this.saveTasks(); // Persist changes.
          }
        }
        // Finalize drag operation via DragDropManager.
        this.dragDropManager.handleDragEnd(taskElement);
      }
    });

    // Event listener for drag end (mouse).
    // Delegates cleanup to DragDropManager.
    taskElement.addEventListener('dragend', () => {
      this.dragDropManager.handleDragEnd(taskElement);
    });

    taskElement
      .querySelector('.edit-task-btn')
      .addEventListener('click', () => {
        this.openTaskModal(task.column, task);
      });

    taskElement
      .querySelector('.delete-task-btn')
      .addEventListener('click', () => {
        this.deleteTask(task.id);
      });
  }

  // Sorts tasks within a specific board based on a given criterion and direction.
  sortTasks(boardIndex, sortBy, direction) {
    // Filter tasks that belong to the specified board.
    const boardTasks = this.tasks.filter(task => task.column === boardIndex);

    // Sort the filtered tasks.
    boardTasks.sort((a, b) => {
      let comparison = 0;
      // Determine comparison logic based on the 'sortBy' criterion.
      if (sortBy === 'priority') {
        // Assign numerical values to priorities for comparison.
        const priorityValues = {high: 3, medium: 2, low: 1};
        const priorityA = priorityValues[a.priority] || 0; // Default to 0 if priority is undefined.
        const priorityB = priorityValues[b.priority] || 0;
        comparison = priorityA - priorityB;
      } else if (sortBy === 'dueDate') {
        // Handle cases where due dates might be missing.
        if (!a.dueDate && !b.dueDate) comparison = 0;
        else if (!a.dueDate) comparison = direction === 'asc' ? 1 : -1; // Tasks without due dates go last (asc) or first (desc).
        else if (!b.dueDate) comparison = direction === 'asc' ? -1 : 1;
        else comparison = new Date(a.dueDate) - new Date(b.dueDate); // Compare dates directly.
      } else if (sortBy === 'title') {
        // Use localeCompare for string comparison of titles.
        comparison = a.title.localeCompare(b.title);
      }
      // Adjust comparison result based on the 'direction' (ascending or descending).
      return direction === 'desc' ? -comparison : comparison;
    });

    // Remove the original (unsorted) tasks of the board from the main tasks array.
    this.tasks = this.tasks.filter(task => task.column !== boardIndex);
    // Concatenate the sorted tasks back into the main tasks array.
    this.tasks = [...this.tasks, ...boardTasks];
    this.saveTasks(); // Persist the sorted tasks and re-render.
  }
}

export default TaskManager;
