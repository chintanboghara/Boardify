// js/components/TaskModalComponent.js

class TaskModalComponent {
    constructor({ onSave, onCancel, onArchiveRequest, onAddSubtask, onDeleteSubtask, onToggleSubtask, onAddAttachment, onDeleteAttachment }) {
        this.onSave = onSave;
        this.onCancel = onCancel;
        this.onArchiveRequest = onArchiveRequest;
        // Callbacks for direct modifications to TaskManager/Store if needed for complex items
        // For now, subtasks/attachments will be managed locally and saved in bulk with the main task.
        // These props are placeholders if a more direct interaction model is chosen later.
        this.onAddSubtask = onAddSubtask;
        this.onDeleteSubtask = onDeleteSubtask;
        this.onToggleSubtask = onToggleSubtask;
        this.onAddAttachment = onAddAttachment;
        this.onDeleteAttachment = onDeleteAttachment;

        // --- DOM Element References ---
        this.modalElement = document.getElementById('task-modal');
        this.modalTitleElement = this.modalElement.querySelector('h3'); // Assuming h3 is the title
        this.taskForm = document.getElementById('task-form');

        // Form fields
        this.titleInput = document.getElementById('task-title');
        this.descriptionInput = document.getElementById('task-description');
        this.priorityInput = document.getElementById('task-priority');
        this.dueDateInput = document.getElementById('task-due-date');
        this.assigneeInput = document.getElementById('task-assignee');

        // Sections
        this.subtaskListElement = document.getElementById('subtask-list');
        this.newSubtaskTitleInput = document.getElementById('new-subtask-title');
        this.activityLogListElement = document.getElementById('activity-log-list');
        this.attachmentListElement = document.getElementById('attachment-list');
        this.taskFileInput = document.getElementById('task-file-input');

        // Buttons
        this.saveButton = this.taskForm.querySelector('button[type="submit"]');
        this.cancelButton = document.getElementById('cancel-modal'); // or this.taskForm.querySelector('#cancel-modal');
        this.closeModalButton = document.getElementById('close-modal');
        this.archiveButton = document.getElementById('archive-task-modal-btn');
        this.addSubtaskButton = document.getElementById('add-subtask-btn');
        // Add other buttons like attachment delete if they need direct listeners here.

        // --- Internal State ---
        this.isVisible = false;
        this.currentTask = null; // Will hold a *copy* of the task being edited, or data for a new task
        this.isEditing = false;
        this.targetColumnIndex = null; // For new tasks

        this._attachInternalListeners();
    }

    _attachInternalListeners() {
        // Listeners for buttons that are part of the modal component itself
        if (this.saveButton) {
            this.saveButton.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default form submission
                this._handleSave();
            });
        }
        if (this.cancelButton) {
            this.cancelButton.addEventListener('click', () => this._handleCancel());
        }
        if (this.closeModalButton) {
            this.closeModalButton.addEventListener('click', () => this._handleCancel());
        }
        if (this.archiveButton) {
            this.archiveButton.addEventListener('click', () => this._handleArchive());
        }

        // Subtask and attachment listeners will be more complex due to dynamic content
        // These will be further detailed in Step 2 of the plan.
        // For now, placeholder for where they'd be initialized.
        if (this.addSubtaskButton) {
            this.addSubtaskButton.addEventListener('click', () => this._handleAddSubtaskClick());
        }
        if (this.subtaskListElement) {
            // Using event delegation for subtask item interactions (checkbox, delete)
            this.subtaskListElement.addEventListener('click', (event) => this._handleSubtaskListDelegatedClick(event));
        }

        if (this.taskFileInput) {
            this.taskFileInput.addEventListener('change', (event) => this._handleFileSelected(event));
        }
        if (this.attachmentListElement) {
            // Using event delegation for attachment item interactions (delete)
            this.attachmentListElement.addEventListener('click', (event) => this._handleAttachmentListDelegatedClick(event));
        }

        // Listen for Ctrl+Enter or Cmd+Enter on the modal element itself for saving
        this.modalElement.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                // Check if the modal is visible and if the active element is within the modal
                // to avoid triggering save if, for example, a global search input is focused while modal is open.
                // However, this.modalElement.contains(document.activeElement) might be too restrictive
                // if focus can be on elements not strictly *inside* the modal's main div but related.
                // A simpler check is this.isVisible and that the event is not coming from an input that uses Enter for other purposes.
                if (this.isVisible) {
                    const activeElementTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : null;
                    // Prevent save if enter is pressed in textarea (which should add a newline)
                    if (activeElementTag === 'textarea') {
                        return;
                    }
                    e.preventDefault();
                    this._handleSave();
                }
            }
            // Optional: Handle Escape key to close the modal, for full encapsulation
            // if (e.key === 'Escape' && this.isVisible) {
            //     e.preventDefault();
            //     this._handleCancel();
            // }
        });
    }

    show(taskToEdit = null, columnIndex = null) {
        this.isVisible = true;
        if (taskToEdit) {
            // Deep copy the task to prevent direct mutation of the original object from the store
            this.currentTask = JSON.parse(JSON.stringify(taskToEdit));
            this.isEditing = true;
            this.modalTitleElement.textContent = 'Edit Task';
            this._populateForm(this.currentTask);
            this.archiveButton.classList.remove('hidden');
            this.archiveButton.innerHTML = this.currentTask.isArchived ?
                '<i class="fas fa-box-open mr-1 sm:mr-2"></i> <span class="hidden sm:inline">Unarchive Task</span><span class="sm:hidden">Unarchive</span>' :
                '<i class="fas fa-archive mr-1 sm:mr-2"></i> <span class="hidden sm:inline">Archive Task</span><span class="sm:hidden">Archive</span>';
            this.archiveButton.title = this.currentTask.isArchived ? 'Unarchive Task' : 'Archive Task';

        } else {
            this.currentTask = { // Default structure for a new task
                title: '',
                description: '',
                priority: 'low',
                dueDate: '',
                assignee: '',
                subtasks: [],
                activityLog: [], // Activity log is typically read-only display in modal
                attachments: [],
                isArchived: false // New tasks are not archived
            };
            this.isEditing = false;
            this.targetColumnIndex = columnIndex;
            this.modalTitleElement.textContent = 'Add New Task';
            this.taskForm.reset(); // Clear basic input fields
            this._populateForm(this.currentTask); // Populate with defaults (e.g. priority)
            this.archiveButton.classList.add('hidden');
        }

        // Render dynamic content
        this._renderSubtasksDisplay();
        this._renderActivityLogDisplay();
        this._renderAttachmentsDisplay();

        this.modalElement.classList.remove('hidden');
        this.modalElement.classList.add('flex');
        this.titleInput.focus(); // Focus title input on open
    }

    hide() {
        this.isVisible = false;
        this.modalElement.classList.add('hidden');
        this.modalElement.classList.remove('flex');
        // Reset state for next opening, ensuring a clean slate
        this.currentTask = null;
        this.isEditing = false;
        this.targetColumnIndex = null;
        this.taskForm.reset(); // Good practice to reset form on close
        this.subtaskListElement.innerHTML = '';
        this.activityLogListElement.innerHTML = '';
        this.attachmentListElement.innerHTML = '';
        this.taskFileInput.value = ''; // Reset file input
    }

    _populateForm(taskData) {
        if (!taskData) return;
        this.titleInput.value = taskData.title || '';
        this.descriptionInput.value = taskData.description || '';
        this.priorityInput.value = taskData.priority || 'low';
        this.dueDateInput.value = taskData.dueDate || '';
        this.assigneeInput.value = taskData.assignee || '';
    }

    _collectFormData() {
        if (!this.currentTask) return null; // Should not happen if modal is visible

        // Create a new object for the form data to avoid mutating currentTask directly yet
        const formData = {
            // For existing tasks, preserve ID and original column (unless column changes are handled here)
            id: this.isEditing ? this.currentTask.id : undefined, // ID only if editing
            column: this.isEditing ? this.currentTask.column : this.targetColumnIndex,

            title: this.titleInput.value.trim(),
            description: this.descriptionInput.value.trim(),
            priority: this.priorityInput.value,
            dueDate: this.dueDateInput.value,
            assignee: this.assigneeInput.value.trim(),

            // Subtasks, attachments, and activityLog are taken directly from this.currentTask,
            // as they are managed by their dedicated handlers (_handleAddSubtask, etc.)
            // which modify this.currentTask directly (the local copy).
            subtasks: [...this.currentTask.subtasks], // Send a copy
            attachments: [...this.currentTask.attachments], // Send a copy

            // Activity log is generally not edited; it's part of the task data loaded
            // and re-saved. If new logs are generated by modal actions, they'd be added
            // to this.currentTask.activityLog by those specific actions.
            activityLog: this.currentTask.activityLog ? [...this.currentTask.activityLog] : [],
            isArchived: this.currentTask.isArchived, // Preserve archived state
        };
        return formData;
    }

    _handleSave() {
        const taskData = this._collectFormData();
        if (!taskData.title) {
            alert('Task title cannot be empty.');
            this.titleInput.focus();
            return;
        }
        // The onSave callback is expected to handle persistence and then hide the modal
        // or signal success/failure. For now, TaskManager will hide it.
        if (this.onSave) {
            this.onSave(taskData, this.isEditing, this.targetColumnIndex);
            // TaskManager will call component.hide() after successful save.
        }
    }

    _handleCancel() {
        if (this.onCancel) {
            this.onCancel();
        }
        this.hide();
    }

    _handleArchive() {
        if (this.isEditing && this.currentTask && this.onArchiveRequest) {
            this.onArchiveRequest(this.currentTask.id, this.currentTask.isArchived);
            // TaskManager will call component.hide() after successful archive.
        }
    }

    // --- Placeholder methods for dynamic content rendering ---
    // These will be fleshed out in Step 2. They operate on this.currentTask.
    _renderSubtasksDisplay() {
        // console.log('TaskModalComponent: _renderSubtasksDisplay called for task:', this.currentTask);
        // Actual rendering logic will go here in the next step.
        // For now, just ensuring it's callable.
        this.subtaskListElement.innerHTML = ''; // Clear previous
        if (!this.currentTask || !this.currentTask.subtasks) return;

        this.currentTask.subtasks.forEach(subtask => {
            const li = document.createElement('li');
            li.className = `flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-md`;
            li.dataset.subtaskId = subtask.id;
            li.innerHTML = `
                <div class="flex items-center">
                    <input type="checkbox" class="subtask-checkbox form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 dark:border-gray-500 dark:bg-gray-600 focus:ring-indigo-500 dark:focus:ring-indigo-400" ${subtask.completed ? 'checked' : ''} data-subtask-id="${subtask.id}">
                    <span class="ml-2 text-sm text-gray-800 dark:text-gray-200 ${subtask.completed ? 'line-through' : ''}">${subtask.title}</span>
                </div>
                <button type="button" class="subtask-delete-btn text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500" data-subtask-id="${subtask.id}">
                    <i class="fas fa-trash-alt text-xs"></i>
                </button>
            `;
            this.subtaskListElement.appendChild(li);
        });
    }

    _renderActivityLogDisplay() {
        // console.log('TaskModalComponent: _renderActivityLogDisplay called for task:', this.currentTask);
        this.activityLogListElement.innerHTML = ''; // Clear previous
        if (!this.currentTask || !this.currentTask.activityLog || this.currentTask.activityLog.length === 0) {
            const li = document.createElement('li');
            li.className = 'text-xs text-gray-500 dark:text-gray-400 py-1 italic';
            li.textContent = 'No activity yet for this task.';
            this.activityLogListElement.appendChild(li);
            return;
        }
        this.currentTask.activityLog.forEach(logEntry => {
            const li = document.createElement('li');
            li.className = 'text-xs text-gray-600 dark:text-gray-400 py-1';
            const timestamp = new Date(logEntry.timestamp);
            const formattedTimestamp = `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`;
            li.innerHTML = `<span class="font-semibold text-gray-700 dark:text-gray-300">${formattedTimestamp}:</span> ${logEntry.details}`;
            this.activityLogListElement.appendChild(li);
        });
    }

    _renderAttachmentsDisplay() {
        // console.log('TaskModalComponent: _renderAttachmentsDisplay called for task:', this.currentTask);
        this.attachmentListElement.innerHTML = ''; // Clear previous
        if (!this.currentTask || !this.currentTask.attachments || this.currentTask.attachments.length === 0) {
            const li = document.createElement('li');
            li.className = 'text-xs text-gray-500 dark:text-gray-400 py-1 italic';
            li.textContent = 'No files attached.';
            this.attachmentListElement.appendChild(li);
            return;
        }
        this.currentTask.attachments.forEach(attachment => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between p-1.5 bg-gray-100 dark:bg-gray-700 rounded-md text-xs mb-2';
            li.dataset.attachmentId = attachment.id;

            let fileDisplayContainer = document.createElement('div');
            fileDisplayContainer.className = 'flex items-center flex-grow truncate mr-2';

            if (attachment.fileDataURL && attachment.fileType && attachment.fileType.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = attachment.fileDataURL;
                img.alt = attachment.fileName;
                img.className = 'max-w-[80px] max-h-14 object-cover mr-2 rounded-sm';
                fileDisplayContainer.appendChild(img);
            }
            const fileNameSpan = document.createElement('span');
            fileNameSpan.className = 'font-medium text-gray-800 dark:text-gray-200 break-all';
            fileNameSpan.textContent = attachment.fileName;
            fileDisplayContainer.appendChild(fileNameSpan);

            const fileMetaSpan = document.createElement('span');
            fileMetaSpan.className = 'text-gray-500 dark:text-gray-400 ml-2 text-xs';
            // Helper for formatting file size, assuming it's available or will be added.
            fileMetaSpan.textContent = `(${attachment.fileType || 'unknown type'}, ${this._formatFileSize(attachment.fileSize || 0)})`;
            fileDisplayContainer.appendChild(fileMetaSpan);
            li.appendChild(fileDisplayContainer);

            const controlsContainer = document.createElement('div');
            controlsContainer.className = 'flex items-center flex-shrink-0';
            if (attachment.fileDataURL) {
                const downloadLink = document.createElement('a');
                downloadLink.href = attachment.fileDataURL;
                downloadLink.download = attachment.fileName;
                downloadLink.innerHTML = '<i class="fas fa-download text-xs"></i>';
                downloadLink.className = 'attachment-download-btn text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-500 mr-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600';
                downloadLink.title = `Download ${attachment.fileName}`;
                controlsContainer.appendChild(downloadLink);
            }
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'attachment-delete-btn text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600';
            deleteButton.innerHTML = '<i class="fas fa-trash-alt text-xs"></i>';
            deleteButton.title = `Delete ${attachment.fileName}`;
            deleteButton.dataset.attachmentId = attachment.id; // For delegation
            controlsContainer.appendChild(deleteButton);
            li.appendChild(controlsContainer);
            this.attachmentListElement.appendChild(li);
        });
    }

    _formatFileSize(bytes) { // Helper function
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // --- Placeholder handlers for dynamic content interactions ---
    _handleAddSubtaskClick() {
        // console.log('TaskModalComponent: _handleAddSubtaskClick called');
        // Logic for adding subtask to this.currentTask.subtasks and re-rendering
        // Will be detailed in Step 2.
        const title = this.newSubtaskTitleInput.value.trim();
        if (!title) {
            alert('Subtask title cannot be empty.');
            return;
        }
        if (!this.currentTask) return;

        const newSubtask = {
            id: `sub_${Date.now().toString()}_${Math.random().toString(36).substring(2, 7)}`, // Temporary ID
            title: title,
            completed: false
        };
        this.currentTask.subtasks.push(newSubtask);
        this._renderSubtasksDisplay();
        this.newSubtaskTitleInput.value = '';
        this.newSubtaskTitleInput.focus();
    }

    _handleSubtaskListDelegatedClick(event) {
        const target = event.target;
        const subtaskLi = target.closest('li[data-subtask-id]');
        if (!subtaskLi || !this.currentTask) return;

        const subtaskId = subtaskLi.dataset.subtaskId;
        const subtask = this.currentTask.subtasks.find(st => st.id === subtaskId);
        if (!subtask) return;

        if (target.matches('.subtask-checkbox, .subtask-checkbox *')) {
            subtask.completed = !subtask.completed;
            this._renderSubtasksDisplay(); // Re-render to show change
        } else if (target.matches('.subtask-delete-btn, .subtask-delete-btn *')) {
            if (confirm(`Are you sure you want to delete subtask: "${subtask.title}"?`)) {
                this.currentTask.subtasks = this.currentTask.subtasks.filter(st => st.id !== subtaskId);
                this._renderSubtasksDisplay();
            }
        }
    }

    _handleFileSelected(event) {
        // console.log('TaskModalComponent: _handleFileSelected called');
        // Logic for adding attachment to this.currentTask.attachments and re-rendering
        // Will be detailed in Step 2.
        const file = event.target.files[0];
        if (!file || !this.currentTask) {
            this.taskFileInput.value = ''; // Clear if no file selected
            return;
        }

        const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
        if (file.size > MAX_FILE_SIZE) {
            alert(`File "${file.name}" (${this._formatFileSize(file.size)}) exceeds the 1MB limit.`);
            this.taskFileInput.value = ''; // Clear file input
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const newAttachment = {
                id: `att_${Date.now().toString()}_${Math.random().toString(36).substring(2, 7)}`, // Temporary ID
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                fileDataURL: e.target.result, // Base64 encoded file content
                attachedAt: new Date().toISOString()
            };
            this.currentTask.attachments.push(newAttachment);
            this._renderAttachmentsDisplay();
            this.taskFileInput.value = ''; // Clear file input after successful read
        };
        reader.onerror = () => {
            alert(`Error reading file "${file.name}".`);
            this.taskFileInput.value = ''; // Clear file input
        };
        reader.readAsDataURL(file);
    }

    _handleAttachmentListDelegatedClick(event) {
        const target = event.target;
        const deleteButton = target.closest('.attachment-delete-btn');
        if (!deleteButton || !this.currentTask) return;

        const attachmentLi = deleteButton.closest('li[data-attachment-id]');
        if (!attachmentLi) return;

        const attachmentId = attachmentLi.dataset.attachmentId;
        const attachment = this.currentTask.attachments.find(att => att.id === attachmentId);
        if (!attachment) return;

        if (confirm(`Are you sure you want to delete attachment: "${attachment.fileName}"?`)) {
            this.currentTask.attachments = this.currentTask.attachments.filter(att => att.id !== attachmentId);
            this._renderAttachmentsDisplay();
        }
    }
}

// Export if using modules, otherwise it's globally available if script is included directly.
// export default TaskModalComponent;
// For now, assuming it might be used without module system in this project,
// but 'export default' would be standard for module-based JS.
