// js/components/TaskCard.js

// Helper function for priority classes (can be moved to a shared utils.js later if needed)
function getPriorityClass(priority) {
  switch (priority) {
    case 'high':
      return 'bg-rose-300 dark:bg-rose-500 text-gray-800 dark:text-white';
    case 'medium':
      return 'bg-amber-300 dark:bg-amber-500 text-gray-800 dark:text-white';
    default: // 'low' or undefined
      return 'bg-green-300 dark:bg-green-500 text-gray-800 dark:text-white';
  }
}

export function TaskCard(task, eventHandlers) {
  if (!task) {
    console.error("TaskCard: task data is required.");
    return null;
  }
  if (!eventHandlers || typeof eventHandlers.onEditTask !== 'function' || typeof eventHandlers.onArchiveTask !== 'function') {
    console.error("TaskCard: onEditTask and onArchiveTask event handlers are required.");
    return null;
  }

  const taskElement = document.createElement('div');
  taskElement.className = 'task bg-white dark:bg-[#151A1C] rounded-md shadow-lg p-4 mt-1 flex flex-col hover:shadow-xl transition-shadow relative'; // task is the main class.
  taskElement.id = `task-${task.id}`;
  taskElement.dataset.taskId = task.id;
  taskElement.draggable = true; // Task itself is draggable

  const priorityClass = getPriorityClass(task.priority);
  const priorityText = task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Low';

  let subtaskDisplayHtml = '';
  if (task.subtasks && task.subtasks.length > 0) {
    const totalSubtasks = task.subtasks.length;
    const completedSubtasks = task.subtasks.filter(st => st.completed).length;
    const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
    subtaskDisplayHtml = `
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-1">Subtasks: ${completedSubtasks} / ${totalSubtasks}</p>
      <div class="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 mb-2">
        <div class="bg-indigo-600 h-1.5 rounded-full" style="width: ${progressPercentage}%"></div>
      </div>
    `;
  }

  // Due date display (basic, without overdue styling which TaskManager will handle)
  const dueDateHtml = task.dueDate
    ? `<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Due: ${new Date(task.dueDate).toLocaleDateString()}</p>`
    : '';

  const assigneeHtml = task.assignee
    ? `<p class="text-gray-600 dark:text-gray-400 break-words line-clamp-3 text-sm mt-1">Assignee: ${task.assignee}</p>`
    : '';

  // Use marked.parse for description (assuming marked is globally available from CDN)
  const descriptionHtml = task.description
    ? (typeof marked !== 'undefined' ? marked.parse(task.description) : `<p>${task.description.replace(/\n/g, '<br>')}</p>`) // Fallback if marked not loaded
    : '<p class="text-gray-500 italic">No description</p>';

  taskElement.innerHTML = `
    <div class="flex justify-between items-start mb-3">
      <h4 class="font-medium text-gray-900 dark:text-white text-lg">${task.title}</h4>
      <span class="priority-badge flex items-center justify-center text-sm px-3 py-1 rounded-md ${priorityClass}" data-priority="${task.priority}">
        ${priorityText}
      </span>
    </div>
    <div class="prose prose-sm dark:prose-invert text-gray-600 dark:text-gray-400 break-words line-clamp-3 mb-4">
      ${descriptionHtml}
    </div>
    ${subtaskDisplayHtml}
    ${dueDateHtml}
    ${assigneeHtml}
    <div class="flex justify-end space-x-2 mt-auto pt-2">
      <button class="task-card-edit-btn p-2 text-gray-700 rounded-md transition-all hover:bg-white/20 dark:text-gray-300" title="Edit Task">
        <i class="fas fa-pencil-alt text-sm"></i>
      </button>
      <button class="task-card-archive-btn p-2 text-gray-700 rounded-md transition-all hover:bg-white/20 dark:text-gray-300" title="Archive Task">
        <i class="fas fa-archive text-sm"></i>
      </button>
    </div>
  `;

  // Attach event listeners
  const editButton = taskElement.querySelector('.task-card-edit-btn');
  if (editButton) {
    editButton.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent card click or other underlying events if any
      eventHandlers.onEditTask(task);
    });
  }

  const archiveButton = taskElement.querySelector('.task-card-archive-btn');
  if (archiveButton) {
    archiveButton.addEventListener('click', (e) => {
      e.stopPropagation();
      eventHandlers.onArchiveTask(task.id);
    });
  }

  return taskElement;
}
