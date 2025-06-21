
import React, { useState, useEffect, FormEvent } from 'react';
import { Task, Subtask, Attachment, Priority } from '../types';
import { XIcon, PlusIcon, TrashIcon, CircleSlashIcon, AlertTriangleIcon } from '../icons';
import { v4 as uuidv4 } from 'uuid';
import { PRIORITY_LEVELS, DEFAULT_PRIORITY } from '../constants';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'order'>) => void;
  existingTask?: Task;
  boardId: string;
  columnId: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, existingTask }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [labels, setLabels] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState<Priority>(DEFAULT_PRIORITY);
  
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [currentSubtaskText, setCurrentSubtaskText] = useState('');

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [currentAttachmentUrl, setCurrentAttachmentUrl] = useState('');
  const [currentAttachmentName, setCurrentAttachmentName] = useState('');

  const [coverColor, setCoverColor] = useState<string>('');
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');

  const [formError, setFormError] = useState<string | null>(null);
  const [attachmentUrlError, setAttachmentUrlError] = useState<string | null>(null);


  useEffect(() => {
    if (isOpen) {
      if (existingTask) {
        setTitle(existingTask.title);
        setDescription(existingTask.description || '');
        setLabels(existingTask.labels.join(', '));
        setDueDate(existingTask.dueDate || '');
        setPriority(existingTask.priority || DEFAULT_PRIORITY);
        setSubtasks(existingTask.subtasks || []);
        setAttachments(existingTask.attachments || []);
        setCoverColor(existingTask.coverColor || '');
        setCoverImageUrl(existingTask.coverImageUrl || '');
      } else {
        setTitle('');
        setDescription('');
        setLabels('');
        setDueDate('');
        setPriority(DEFAULT_PRIORITY);
        setSubtasks([]);
        setCurrentSubtaskText('');
        setAttachments([]);
        setCurrentAttachmentUrl('');
        setCurrentAttachmentName('');
        setCoverColor('');
        setCoverImageUrl('');
      }
      setFormError(null); 
      setAttachmentUrlError(null); // Clear errors when modal opens or existingTask changes
    }
  }, [existingTask, isOpen]);

  const handleAddSubtask = () => {
    if (currentSubtaskText.trim()) {
      setSubtasks([...subtasks, { id: uuidv4(), text: currentSubtaskText.trim(), completed: false }]);
      setCurrentSubtaskText('');
    }
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st));
  };

  const deleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };
  
  const handleAddAttachment = () => {
    if (!currentAttachmentUrl.trim()) {
      setAttachmentUrlError("Attachment URL cannot be empty.");
      return;
    }
    try {
      new URL(currentAttachmentUrl.trim()); // Validate URL format
      setAttachments([...attachments, { id: uuidv4(), url: currentAttachmentUrl.trim(), name: currentAttachmentName.trim() || undefined }]);
      setCurrentAttachmentUrl('');
      setCurrentAttachmentName('');
      setAttachmentUrlError(null);
    } catch (error) {
      setAttachmentUrlError("Invalid URL. Please enter a valid URL (e.g., https://example.com).");
    }
  };

  const deleteAttachment = (id: string) => {
    setAttachments(attachments.filter(att => att.id !== id));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError("Title cannot be empty. Please enter a title for the task.");
      setAttachmentUrlError(null); // Clear attachment error if title is the issue
      return;
    }
    // If there's a pending attachment URL with an error, prevent submission
    if (currentAttachmentUrl.trim() && attachmentUrlError) {
        // Optionally, you could refocus the attachment URL field or provide a more general error
        setFormError("Please fix errors in the form before saving.");
        return;
    }

    setFormError(null);
    setAttachmentUrlError(null);

    const labelArray = labels.split(',').map(label => label.trim()).filter(label => label);
    onSave({ 
      title: title.trim(), 
      description: description.trim() || undefined, 
      labels: labelArray,
      dueDate: dueDate || undefined,
      priority: priority === DEFAULT_PRIORITY ? undefined : priority,
      subtasks: subtasks.length > 0 ? subtasks : [],
      attachments: attachments.length > 0 ? attachments : [],
      coverColor: coverColor || undefined,
      coverImageUrl: coverImageUrl.trim() || undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  const formInputClass = "block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500";
  const formCheckboxClass = "h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4 animate-fadeIn" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
      <div className="bg-white dark:bg-[#202020] p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto animate-slideInUp">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 id="task-modal-title" className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100">
            {existingTask ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Close modal">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {formError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-md flex items-center" role="alert">
            <AlertTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="text-sm">{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info: Title, Description, Labels */}
          <div>
            <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="taskTitle"
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (formError) setFormError(null); }}
              className={`${formInputClass} ${formError && !title.trim() ? 'border-red-500' : ''}`}
              required
              autoFocus 
              aria-invalid={formError && !title.trim() ? "true" : "false"}
              aria-describedby={formError && !title.trim() ? "form-error-message" : undefined}
            />
          </div>
          <div>
            <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              id="taskDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={formInputClass}
            />
          </div>
          <div>
            <label htmlFor="taskLabels" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Labels (comma-separated)</label>
            <input
              type="text"
              id="taskLabels"
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              placeholder="e.g., urgent, feature"
              className={formInputClass}
            />
          </div>

          {/* Due Date & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="taskDueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
              <div className="flex">
                <input
                  type="date"
                  id="taskDueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`${formInputClass} rounded-r-none`}
                />
                <button type="button" onClick={() => setDueDate('')} title="Clear due date" className="p-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md hover:bg-gray-100 dark:hover:bg-gray-600">
                  <CircleSlashIcon className="w-5 h-5 text-gray-500 dark:text-gray-400"/>
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="taskPriority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
              <select
                id="taskPriority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className={formInputClass}
              >
                {PRIORITY_LEVELS.map(p => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          
          {/* Subtasks */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Subtasks</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto mb-2 pr-2">
              {subtasks.map(st => (
                <div key={st.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                  <label className="flex items-center space-x-2 flex-grow cursor-pointer">
                    <input type="checkbox" checked={st.completed} onChange={() => toggleSubtask(st.id)} className={formCheckboxClass}/>
                    <span className={`${st.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>{st.text}</span>
                  </label>
                  <button type="button" onClick={() => deleteSubtask(st.id)} className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" aria-label={`Delete subtask ${st.text}`}>
                    <TrashIcon className="w-4 h-4"/>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="text" 
                value={currentSubtaskText} 
                onChange={(e) => setCurrentSubtaskText(e.target.value)} 
                placeholder="New subtask text"
                className={`flex-grow ${formInputClass}`}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask();}}}
              />
              <button type="button" onClick={handleAddSubtask} className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600" aria-label="Add subtask">
                <PlusIcon className="w-5 h-5"/>
              </button>
            </div>
          </div>

          {/* Attachments (URL-based) */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
             <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Attachments (Links)</h3>
             <div className="space-y-2 max-h-40 overflow-y-auto mb-2 pr-2">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate flex-grow mr-2" title={att.url}>
                      {att.name || att.url}
                    </a>
                    <button type="button" onClick={() => deleteAttachment(att.id)} className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" aria-label={`Delete attachment ${att.name || att.url}`}>
                      <TrashIcon className="w-4 h-4"/>
                    </button>
                  </div>
                ))}
             </div>
             <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input 
                    type="url" 
                    value={currentAttachmentUrl} 
                    onChange={(e) => {setCurrentAttachmentUrl(e.target.value); if (attachmentUrlError) setAttachmentUrlError(null);}}
                    placeholder="Attachment URL (e.g., https://...)"
                    className={`${formInputClass} ${attachmentUrlError ? 'border-red-500' : ''}`}
                    aria-invalid={!!attachmentUrlError}
                    aria-describedby={attachmentUrlError ? "attachment-url-error" : undefined}
                    />
                    <input 
                    type="text" 
                    value={currentAttachmentName} 
                    onChange={(e) => setCurrentAttachmentName(e.target.value)} 
                    placeholder="Optional: Link Name"
                    className={formInputClass}
                    />
                </div>
                {attachmentUrlError && <p id="attachment-url-error" className="text-xs text-red-500 dark:text-red-400 mt-1">{attachmentUrlError}</p>}
             </div>
             <button type="button" onClick={handleAddAttachment} className="mt-2 w-full sm:w-auto p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center">
                <PlusIcon className="w-5 h-5 mr-1"/> Add Link
              </button>
          </div>
          
          {/* Cover Appearance */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Cover Appearance</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="taskCoverColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Color</label>
                <div className="flex">
                <input
                  type="color"
                  id="taskCoverColor"
                  value={coverColor}
                  onChange={(e) => setCoverColor(e.target.value)}
                  className="p-0 h-10 w-full border border-gray-300 dark:border-gray-600 rounded-l-md cursor-pointer"
                />
                 <button type="button" onClick={() => setCoverColor('')} title="Clear cover color" className="p-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md hover:bg-gray-100 dark:hover:bg-gray-600">
                  <CircleSlashIcon className="w-5 h-5 text-gray-500 dark:text-gray-400"/>
                </button>
                </div>
              </div>
              <div>
                <label htmlFor="taskCoverImageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Image URL</label>
                 <div className="flex">
                  <input
                    type="url"
                    id="taskCoverImageUrl"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://example.com/image.png"
                    className={`${formInputClass} rounded-r-none`}
                  />
                  <button type="button" onClick={() => setCoverImageUrl('')} title="Clear cover image URL" className="p-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md hover:bg-gray-100 dark:hover:bg-gray-600">
                    <CircleSlashIcon className="w-5 h-5 text-gray-500 dark:text-gray-400"/>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md border border-gray-300 dark:border-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {existingTask ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
