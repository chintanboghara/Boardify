class DragDropManager {
  constructor() {
    this.taskPlaceholder = document.createElement('div');
    this.taskPlaceholder.className =
      'task-placeholder border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-md p-4 bg-gray-50 dark:bg-[#202227]';
    this.taskClone = null; // Will hold the visual clone of the task being dragged
  }

  // Handles the initiation of a drag operation (both mouse drag and touch drag).
  handleDragStart(e, taskElement) {
    // Store the inner HTML and dimensions of the task element to create a visually identical clone.
    const taskHTML = taskElement.innerHTML;
    const taskWidth = taskElement.offsetWidth;
    const taskHeight = taskElement.offsetHeight;

    // Add 'dragging' class to the original element for styling (e.g., to dim it).
    taskElement.classList.add('dragging');

    // For touch events, explicitly mark the element as being dragged.
    // For mouse drag, set dataTransfer data, which is necessary for the drag-and-drop API.
    if (e.type === 'touchmove') { // Note: This might be 'touchstart' in typical scenarios
      taskElement.dataset.beingDragged = 'true';
    } else {
      // 'text/plain' is a common data type. The task's ID is used as the data.
      e.dataTransfer.setData('text/plain', taskElement.dataset.taskId);
    }

    // Create a clone of the task element to provide a visual feedback during drag.
    this.taskClone = document.createElement('div');
    this.taskClone.className = taskElement.className + ' task-clone'; // Inherit classes and add 'task-clone'
    this.taskClone.innerHTML = taskHTML; // Replicate content
    this.taskClone.style.width = `${taskWidth}px`; // Match original width
    this.taskClone.style.height = `${taskHeight}px`; // Match original height
    this.taskClone.style.opacity = '0.7'; // Make it slightly transparent
    this.taskClone.style.position = 'fixed'; // Position it relative to the viewport
    this.taskClone.style.pointerEvents = 'none'; // Prevent clone from interfering with mouse events
    this.taskClone.style.zIndex = '1000'; // Ensure it's above other elements

    // Position the clone based on the event type (touch or mouse).
    if (e.type === 'touchstart') {
      const touch = e.touches[0];
      // Center the clone under the touch point.
      this.taskClone.style.top = `${touch.clientY - taskHeight / 2}px`;
      this.taskClone.style.left = `${touch.clientX - taskWidth / 2}px`;
    } else {
      // For mouse drag, initially position clone off-screen.
      // The browser's drag image will be this clone.
      this.taskClone.style.top = '-9999px';
      this.taskClone.style.left = '-9999px';
      // Set the custom drag image. The offset centers the clone on the cursor.
      e.dataTransfer.setDragImage(
        this.taskClone,
        taskWidth / 2,
        taskHeight / 2,
      );
    }

    // Append the clone to the body to allow free movement across the page.
    document.body.appendChild(this.taskClone);
    // Reduce opacity of the original task element to indicate it's being moved.
    taskElement.style.opacity = '0.3';
  }

  handleTouchMove(e, taskElement) {
    const touch = e.touches[0];
    const touchY = touch.clientY;
    const touchX = touch.clientX;

    if (this.taskClone) {
      this.taskClone.style.top = `${touchY - taskElement.offsetHeight / 2}px`;
      this.taskClone.style.left = `${touchX - taskElement.offsetWidth / 2}px`;
    }

    const elemBelow = document.elementFromPoint(touchX, touchY);
    const column = elemBelow?.closest('.task-list');
    if (column) {
      const afterElement = this.getDragAfterElement(column, touchY);
      this.taskPlaceholder.style.height = `${taskElement.offsetHeight}px`;
      this.taskPlaceholder.style.width = `${taskElement.offsetWidth}px`;
      document.querySelectorAll('.task-placeholder').forEach(el => el.remove());
      if (!afterElement) {
        column.appendChild(this.taskPlaceholder);
      } else {
        column.insertBefore(this.taskPlaceholder, afterElement);
      }
    }
  }

  handleDragEnd(taskElement) {
    taskElement.classList.remove('dragging');
    taskElement.style.opacity = '1';
    taskElement.dataset.beingDragged = 'false'; // Reset drag status
    // Remove the visual clone if it exists
    if (this.taskClone) {
      this.taskClone.remove();
      this.taskClone = null;
    }
    document.querySelectorAll('.task-clone').forEach(clone => clone.remove());
    document.querySelectorAll('.task-placeholder').forEach(el => el.remove());
  }

  // Determines which existing task element the dragged task should be placed before.
  // This is used to position the placeholder correctly during drag-over.
  getDragAfterElement(container, y) {
    // Get all task elements in the container, excluding the one currently being dragged.
    const draggableElements = [
      ...container.querySelectorAll('.task:not(.dragging)'),
    ];

    let closest = null; // Stores the element that the dragged task should come after.
    let closestOffset = Number.POSITIVE_INFINITY; // Initialize with a very large offset.

    // Iterate over each draggable element in the container.
    draggableElements.forEach(task => {
      const box = task.getBoundingClientRect(); // Get dimensions and position of the task.
      // Calculate the vertical distance between the mouse pointer (y) and the center of the task.
      const offset = y - (box.top + box.height / 2);

      // If the offset is negative (mouse is above the center of the task)
      // and this offset is smaller (closer to zero) than the current closestOffset,
      // then this task is a candidate to be the element before which the new task is inserted.
      if (offset < 0 && Math.abs(offset) < closestOffset) {
        closestOffset = Math.abs(offset);
        closest = task;
      }
    });

    return closest; // Return the task element that the dragged item should be inserted before.
  }

  // Implements automatic scrolling when a dragged task is near the horizontal edges of the board.
  autoScrollOnDrag(event) {
    const scrollContainer = document.querySelector('.board'); // The main scrollable board area.
    if (!scrollContainer) return;

    const scrollSpeed = 100; // Speed of scrolling in pixels.
    const edgeThreshold = 110; // Distance from edge to trigger scrolling.
    const {clientX} = event; // Horizontal mouse/touch position.
    const {left, right} = scrollContainer.getBoundingClientRect(); // Board's left and right boundaries.

    // If mouse is near the left edge, scroll left.
    if (clientX < left + edgeThreshold) {
      scrollContainer.scrollBy({left: -scrollSpeed, behavior: 'smooth'});
    }
    // If mouse is near the right edge, scroll right.
    else if (clientX > right - edgeThreshold) {
      scrollContainer.scrollBy({left: scrollSpeed, behavior: 'smooth'});
    }
  }

  // Sets up drag-and-drop event listeners for all task list (column) elements.
  setupDragAndDrop(taskLists, taskManager) {
    taskLists.forEach(column => {
      // Event listener for 'dragover': Handles behavior when a dragged item is over a column.
      column.addEventListener('dragover', e => {
        e.preventDefault(); // Necessary to allow a drop.
        const draggingTask = document.querySelector('.dragging'); // Get the task element being dragged.
        if (!draggingTask) return;

        // Determine where the placeholder should appear based on mouse position.
        const afterElement = this.getDragAfterElement(column, e.clientY);
        // Set placeholder dimensions to match the dragging task.
        this.taskPlaceholder.style.height = `${draggingTask.offsetHeight}px`;
        this.taskPlaceholder.style.width = `${draggingTask.offsetWidth}px`;

        // Remove any existing placeholders before adding a new one.
        document
          .querySelectorAll('.task-placeholder')
          .forEach(el => el.remove());

        // Append placeholder at the determined position.
        if (!afterElement) {
          column.appendChild(this.taskPlaceholder); // Append to end if no element to insert before.
        } else {
          column.insertBefore(this.taskPlaceholder, afterElement); // Insert before the determined element.
        }
      });

      // Event listener for 'dragleave': Removes placeholder if drag leaves the column area appropriately.
      column.addEventListener('dragleave', e => {
        // Check if the mouse truly left the column and not just an element within it.
        if (e.currentTarget === e.target && !column.contains(e.relatedTarget)) {
          document
            .querySelectorAll('.task-placeholder')
            .forEach(el => el.remove());
        }
      });

      // Event listener for 'drop': Handles the actual drop of the task.
      column.addEventListener('drop', e => {
        e.preventDefault(); // Prevent default drop behavior (e.g., opening a link).
        const taskId = e.dataTransfer.getData('text/plain'); // Get task ID from dataTransfer.
        const taskElement = document.getElementById(`task-${taskId}`); // Find the task element by ID.

        if (taskElement) {
          // Determine insertion point again (similar to dragover).
          const afterElement = this.getDragAfterElement(column, e.clientY);
          // Remove placeholder before inserting the actual task.
          document
            .querySelectorAll('.task-placeholder')
            .forEach(el => el.remove());

          // Insert the task element at the correct position.
          if (!afterElement) {
            column.appendChild(taskElement);
          } else {
            column.insertBefore(taskElement, afterElement);
          }
          // Make the task visible and remove dragging class.
          taskElement.classList.remove('invisible', 'dragging');

          // --- TaskManager Interaction ---
          // Update the task's column and order in the TaskManager's data model.
          const taskIndex = taskManager.tasks.findIndex(
            task => task.id === taskId,
          );
          if (taskIndex !== -1) {
            const newColumnIndex = Number.parseInt(column.dataset.index, 10);
            taskManager.tasks[taskIndex].column = newColumnIndex; // Update column index.

            // Reorder tasks in the TaskManager based on the new visual order in the column.
            const updatedTaskList = Array.from(
              column.querySelectorAll('.task'),
            ).map(taskEl => taskEl.dataset.taskId); // Get IDs of tasks in current column order.
            const taskToMove = taskManager.tasks.splice(taskIndex, 1)[0]; // Remove task from old position in array.

            // Find the correct index to insert the moved task in the TaskManager's array.
            // This logic attempts to maintain the visual order within the new column.
            let insertIndex = taskManager.tasks.findIndex(
              task =>
                task.column === newColumnIndex &&
                updatedTaskList.indexOf(task.id) >
                  updatedTaskList.indexOf(taskId),
            );
            if (insertIndex === -1) {
              // If no specific insertion point found (e.g., dropped at the end),
              // find the end of the tasks for the current column or end of all tasks.
              let lastTaskOfColumnIndex = -1;
              for (let i = taskManager.tasks.length - 1; i >= 0; i--) {
                if (taskManager.tasks[i].column === newColumnIndex) {
                  lastTaskOfColumnIndex = i;
                  break;
                }
              }
              if (updatedTaskList.indexOf(taskId) === updatedTaskList.length -1) { // Dropped at the end of the list
                 insertIndex = lastTaskOfColumnIndex !== -1 ? lastTaskOfColumnIndex + 1 : taskManager.tasks.length;
              } else {
                 // Fallback or alternative logic if needed, though the findIndex should cover most cases.
                 // For simplicity, if not found, append to the end of all tasks or tasks of that column.
                 // This might need refinement based on exact desired behavior for edge cases.
                 insertIndex = taskManager.tasks.length; // Default to end if specific index not clear.
              }
            }
            taskManager.tasks.splice(insertIndex, 0, taskToMove); // Insert task at new position.
            taskManager.saveTasks(); // Save changes to localStorage and re-render.
          }
        }
      });
    });
  }
}

export default DragDropManager;
