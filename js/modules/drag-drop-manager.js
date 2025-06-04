import { useTaskStore } from '../store/taskStore.js';

/**
 * Manages drag and drop functionality for tasks.
 */
class DragDropManager {
  /**
   * @param {Object} taskManager - Instance managing tasks.
   */
  constructor(taskManager) {
    this.taskManager = taskManager;
    this.taskPlaceholder = document.createElement('div');
    this.taskPlaceholder.className =
      'task-placeholder border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-md p-4 bg-gray-50 dark:bg-[#202227]';
    this.taskClone = null;
  }

  /**
   * Handles the drag start event for a task.
   * Sets up the drag image (clone) and initial styling.
   *
   * @param {DragEvent | TouchEvent} e - The event triggered on drag start.
   * @param {HTMLElement} taskElement - The task element being dragged.
   */
  handleDragStart(e, taskElement) {
    const taskHTML = taskElement.innerHTML;
    const taskWidth = taskElement.offsetWidth;
    const taskHeight = taskElement.offsetHeight;

    taskElement.classList.add('dragging');

    // For touch events, mark element as being dragged.
    if (e.type === 'touchmove') {
      taskElement.dataset.beingDragged = 'true';
    } else if (e.dataTransfer) {
      // For mouse drag events, store task id in dataTransfer.
      e.dataTransfer.setData('text/plain', taskElement.dataset.taskId);
    }

    // Create a visual clone of the task element.
    this.taskClone = document.createElement('div');
    this.taskClone.className = taskElement.className + ' task-clone';
    this.taskClone.innerHTML = taskHTML;
    this.taskClone.style.width = `${taskWidth}px`;
    this.taskClone.style.height = `${taskHeight}px`;
    this.taskClone.style.opacity = '0.7';
    this.taskClone.style.position = 'fixed';
    this.taskClone.style.pointerEvents = 'none';
    this.taskClone.style.zIndex = '1000';

    // Position the clone based on event type (touch vs. mouse).
    if (e.type === 'touchstart') {
      const touch = e.touches[0];
      this.taskClone.style.top = `${touch.clientY - taskHeight / 2}px`;
      this.taskClone.style.left = `${touch.clientX - taskWidth / 2}px`;
    } else {
      this.taskClone.style.top = '-9999px';
      this.taskClone.style.left = '-9999px';
      if (e.dataTransfer) {
        e.dataTransfer.setDragImage(this.taskClone, taskWidth / 2, taskHeight / 2);
      }
    }

    document.body.appendChild(this.taskClone);
    taskElement.style.opacity = '0.3';
  }

  /**
   * Handles touch move events during drag.
   * Updates the clone position and manages placeholder positioning.
   *
   * @param {TouchEvent} e - The touch move event.
   * @param {HTMLElement} taskElement - The task element being moved.
   */
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
      // Update placeholder dimensions.
      this.taskPlaceholder.style.height = `${taskElement.offsetHeight}px`;
      this.taskPlaceholder.style.width = `${taskElement.offsetWidth}px`;
      this.clearPlaceholders();
      if (!afterElement) {
        column.appendChild(this.taskPlaceholder);
      } else {
        column.insertBefore(this.taskPlaceholder, afterElement);
      }
    }
  }

  /**
   * Handles the end of a drag operation.
   * Restores task styling and removes clones and placeholders.
   *
   * @param {HTMLElement} taskElement - The task element that was dragged.
   */
  handleDragEnd(taskElement) {
    taskElement.classList.remove('dragging');
    taskElement.style.opacity = '1';
    taskElement.dataset.beingDragged = 'false';
    if (this.taskClone) {
      this.taskClone.remove();
      this.taskClone = null;
    }
    // Clean up any leftover clones or placeholders.
    document.querySelectorAll('.task-clone').forEach(clone => clone.remove());
    this.clearPlaceholders();
  }

  /**
   * Returns the element after which the dragged task should be inserted.
   *
   * @param {HTMLElement} container - The container (column) to check.
   * @param {number} y - The vertical coordinate for placement.
   * @returns {HTMLElement|null} The task element after which to insert, or null.
   */
  getDragAfterElement(container, y) {
    const draggableElements = [
      ...container.querySelectorAll('.task:not(.dragging)'),
    ];

    let closest = null;
    let closestOffset = Number.POSITIVE_INFINITY;

    draggableElements.forEach(task => {
      const box = task.getBoundingClientRect();
      const offset = y - (box.top + box.height / 2);
      if (offset < 0 && Math.abs(offset) < closestOffset) {
        closestOffset = Math.abs(offset);
        closest = task;
      }
    });

    return closest;
  }

  /**
   * Automatically scrolls the board horizontally when dragging near edges.
   *
   * @param {MouseEvent} event - The dragover event containing clientX.
   */
  autoScrollOnDrag(event) {
    const scrollContainer = document.querySelector('.board');
    if (!scrollContainer) return;

    const scrollSpeed = 100;
    const edgeThreshold = 110;
    const { clientX } = event;
    const { left, right } = scrollContainer.getBoundingClientRect();

    if (clientX < left + edgeThreshold) {
      scrollContainer.scrollBy({ left: -scrollSpeed, behavior: 'smooth' });
    } else if (clientX > right - edgeThreshold) {
      scrollContainer.scrollBy({ left: scrollSpeed, behavior: 'smooth' });
    }
  }

  /**
   * Sets up drag and drop event listeners on provided task list elements.
   *
   * @param {NodeList | Array<HTMLElement>} taskLists - List of task list elements (columns).
   */
  setupDragAndDrop(taskLists) {
    taskLists.forEach(column => {
      // Handle dragover to position the placeholder.
      column.addEventListener('dragover', e => {
        e.preventDefault();
        const draggingTask = document.querySelector('.dragging');
        if (!draggingTask) return;

        const afterElement = this.getDragAfterElement(column, e.clientY);
        this.taskPlaceholder.style.height = `${draggingTask.offsetHeight}px`;
        this.taskPlaceholder.style.width = `${draggingTask.offsetWidth}px`;
        this.clearPlaceholders();

        if (!afterElement) {
          column.appendChild(this.taskPlaceholder);
        } else {
          column.insertBefore(this.taskPlaceholder, afterElement);
        }
      });

      // Remove placeholder when leaving the column.
      column.addEventListener('dragleave', e => {
        if (e.currentTarget === e.target && !column.contains(e.relatedTarget)) {
          this.clearPlaceholders();
        }
      });

      // Handle drop event: reposition the task and update the task list.
      column.addEventListener('drop', e => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain');
        const taskElement = document.getElementById(`task-${taskId}`);
        if (taskElement) {
          const afterElement = this.getDragAfterElement(column, e.clientY);
          this.clearPlaceholders();
          if (!afterElement) {
            column.appendChild(taskElement);
          } else {
            column.insertBefore(taskElement, afterElement);
          }
          taskElement.classList.remove('invisible', 'dragging');

          // New store-based data update logic
          const newColumnDomElement = taskElement.closest('.task-list');
          if (taskId && newColumnDomElement) {
              const newColumnIndex = Number.parseInt(newColumnDomElement.dataset.index, 10);
              let currentTasks = [...useTaskStore.getState().tasks];

              const taskToMoveIndex = currentTasks.findIndex(t => t.id === taskId);
              if (taskToMoveIndex !== -1) {
                  const taskToMove = { ...currentTasks[taskToMoveIndex] };
                  taskToMove.column = newColumnIndex;

                  currentTasks.splice(taskToMoveIndex, 1);

                  const tasksInNewColumnDomOrder = Array.from(newColumnDomElement.querySelectorAll('.task'))
                                                    .map(el => el.dataset.taskId);

                  const positionInDomColumn = tasksInNewColumnDomOrder.indexOf(taskId);
                  let finalInsertIndexInStoreArray = -1;

                  if (positionInDomColumn === -1) { // Should not happen if taskElement is in newColumnDomElement
                      console.error("DragDropManager: Dropped task not found in its new DOM column.");
                      currentTasks.push(taskToMove); // Failsafe: add to end
                      finalInsertIndexInStoreArray = currentTasks.length -1;
                  } else if (tasksInNewColumnDomOrder.length === 1) {
                      let targetIdx = 0;
                      for (let i = 0; i < currentTasks.length; i++) {
                          if (currentTasks[i].column >= newColumnIndex) {
                              targetIdx = i;
                              break;
                          }
                          targetIdx = i + 1;
                      }
                      finalInsertIndexInStoreArray = targetIdx;
                  } else if (positionInDomColumn === tasksInNewColumnDomOrder.length - 1) {
                      let lastExistingTaskOfColumn = -1;
                      for (let i = currentTasks.length - 1; i >= 0; i--) {
                          if (currentTasks[i].column === newColumnIndex) {
                              lastExistingTaskOfColumn = i;
                              break;
                          }
                      }
                      if (lastExistingTaskOfColumn !== -1) {
                          finalInsertIndexInStoreArray = lastExistingTaskOfColumn + 1;
                      } else {
                          let targetIdx = 0;
                          for (let i = 0; i < currentTasks.length; i++) {
                              if (currentTasks[i].column >= newColumnIndex) {
                                  targetIdx = i;
                                  break;
                              }
                              targetIdx = i + 1;
                          }
                          finalInsertIndexInStoreArray = targetIdx;
                      }
                  } else {
                      const nextTaskInDomId = tasksInNewColumnDomOrder[positionInDomColumn + 1];
                      finalInsertIndexInStoreArray = currentTasks.findIndex(t => t.id === nextTaskInDomId);
                      if (finalInsertIndexInStoreArray === -1) {
                          let lastExistingTaskOfColumn = -1;
                          for (let i = currentTasks.length - 1; i >= 0; i--) {
                              if (currentTasks[i].column === newColumnIndex) {
                                  lastExistingTaskOfColumn = i;
                                  break;
                              }
                          }
                          if (lastExistingTaskOfColumn !== -1) {
                              finalInsertIndexInStoreArray = lastExistingTaskOfColumn + 1;
                          } else {
                              finalInsertIndexInStoreArray = currentTasks.length;
                          }
                      }
                  }

                  if (finalInsertIndexInStoreArray === -1) {
                      finalInsertIndexInStoreArray = currentTasks.length;
                  }

                  currentTasks.splice(finalInsertIndexInStoreArray, 0, taskToMove);

                  useTaskStore.getState().setTasksOrder(currentTasks);
              }
          }
        }
      });
    });
  }

  /**
   * Helper function to remove all task placeholders from the DOM.
   */
  clearPlaceholders() {
    document.querySelectorAll('.task-placeholder').forEach(el => el.remove());
  }
}

export default DragDropManager;
