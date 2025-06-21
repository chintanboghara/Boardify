
import React, { useState, useContext, useMemo } from 'react';
import { Task } from '../types';
import { Draggable } from 'react-beautiful-dnd';
import { TaskModal } from './TaskModal';
import { BoardContext } from '../contexts/BoardContext';
import { PencilIcon, TrashIcon, ClockIcon, AlertTriangleIcon, FlagIcon, CheckSquareIcon, PaperclipIcon, CalendarDaysIcon } from '../icons';
import { ConfirmationModal } from './ConfirmationModal';
import { IconButton } from './IconButton';
import { PRIORITY_MAP } from '../constants';

interface TaskCardProps {
  task: Task;
  index: number;
  boardId: string;
  columnId: string;
}

const getDueDateStatus = (dueDate?: string): { status: 'overdue' | 'due-today' | 'due-soon' | 'none', label: string, colorClass: string, icon?: React.ReactNode } => {
  if (!dueDate) return { status: 'none', label: '', colorClass: 'text-gray-500 dark:text-gray-400' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0,0,0,0); // Compare dates only

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const formattedDate = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  if (diffDays < 0) {
    return { status: 'overdue', label: `Overdue (${formattedDate})`, colorClass: 'text-red-500 dark:text-red-400', icon: <AlertTriangleIcon className="w-3.5 h-3.5 mr-1" /> };
  }
  if (diffDays === 0) {
    return { status: 'due-today', label: `Due Today`, colorClass: 'text-orange-500 dark:text-orange-400', icon: <ClockIcon className="w-3.5 h-3.5 mr-1" /> };
  }
  if (diffDays <= 2) { // Due within 2 days
    return { status: 'due-soon', label: `Due ${formattedDate}`, colorClass: 'text-yellow-500 dark:text-yellow-400', icon: <ClockIcon className="w-3.5 h-3.5 mr-1" /> };
  }
  return { status: 'none', label: formattedDate, colorClass: 'text-gray-500 dark:text-gray-400', icon: <CalendarDaysIcon className="w-3.5 h-3.5 mr-1"/> };
};


export const TaskCard: React.FC<TaskCardProps> = ({ task, index, boardId, columnId }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { updateTask, deleteTask } = useContext(BoardContext);

  const handleUpdateTask = (updatedData: Omit<Task, 'id' | 'order'>) => {
    updateTask(boardId, task.id, updatedData);
  };

  const handleDeleteTask = () => {
    deleteTask(boardId, task.id, columnId);
    setIsDeleteModalOpen(false);
  };

  const dueDateStatus = useMemo(() => getDueDateStatus(task.dueDate), [task.dueDate]);
  const priorityInfo = task.priority && task.priority !== 'none' ? PRIORITY_MAP[task.priority] : null;

  const completedSubtasks = useMemo(() => task.subtasks?.filter(st => st.completed).length || 0, [task.subtasks]);
  const totalSubtasks = useMemo(() => task.subtasks?.length || 0, [task.subtasks]);
  
  const baseCardClasses = "bg-white dark:bg-raisin-black mb-3 rounded-md border border-gray-200 dark:border-gray-700 transition-all duration-150 ease-in-out";
  const restingCardClasses = "shadow-sm hover:shadow-lg";
  const draggingCardClasses = "ring-2 ring-blue-500 shadow-2xl transform rotate-2 scale-[1.03]";

  return (
    <>
      <Draggable draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`${baseCardClasses} ${snapshot.isDragging ? draggingCardClasses : restingCardClasses}`}
          >
            {task.coverImageUrl && (
              <img src={task.coverImageUrl} alt={task.title} className="w-full h-24 sm:h-32 object-cover rounded-t-md" 
                   onError={(e) => (e.currentTarget.style.display = 'none')} // Hide if image fails to load
              />
            )}
            {!task.coverImageUrl && task.coverColor && (
              <div style={{ backgroundColor: task.coverColor }} className="h-2 rounded-t-md"></div>
            )}
            
            <div className="p-3">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 break-words flex-grow mr-2">{task.title}</h4>
                <div className="flex space-x-1 flex-shrink-0">
                  <IconButton
                    icon={<PencilIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                    onClick={() => setIsEditModalOpen(true)}
                    tooltip="Edit Task"
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  />
                  <IconButton
                    icon={<TrashIcon className="w-4 h-4 text-red-500 dark:text-red-400" />}
                    onClick={() => setIsDeleteModalOpen(true)}
                    tooltip="Delete Task"
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded"
                  />
                </div>
              </div>

              {task.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-2 break-words whitespace-pre-wrap">{task.description}</p>
              )}

              <div className="space-y-1.5 text-xs mt-2">
                {dueDateStatus.status !== 'none' && (
                  <div className={`flex items-center ${dueDateStatus.colorClass}`}>
                    {dueDateStatus.icon}
                    <span>{dueDateStatus.label}</span>
                  </div>
                )}
                {priorityInfo && (
                  <div className={`flex items-center ${priorityInfo.iconColor}`}>
                    <FlagIcon className="w-3.5 h-3.5 mr-1" />
                    <span>{priorityInfo.label} Priority</span>
                  </div>
                )}
                {totalSubtasks > 0 && (
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <CheckSquareIcon className="w-3.5 h-3.5 mr-1" />
                    <span>{completedSubtasks}/{totalSubtasks} Subtasks</span>
                  </div>
                )}
              </div>
              
              <div className="mt-2 flex flex-wrap gap-1 items-center justify-between">
                <div>
                {task.labels && task.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {task.labels.map((label, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full">
                        {label}
                      </span>
                    ))}
                  </div>
                )}
                </div>
                {task.attachments && task.attachments.length > 0 && (
                  <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs mt-1 sm:mt-0">
                    <PaperclipIcon className="w-3.5 h-3.5 mr-1" />
                    <span>{task.attachments.length}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Draggable>
      {isEditModalOpen && (
        <TaskModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleUpdateTask}
          existingTask={task}
          boardId={boardId}
          columnId={columnId}
        />
      )}
      {isDeleteModalOpen && (
         <ConfirmationModal
            isOpen={isDeleteModalOpen}
            title="Delete Task"
            message={`Are you sure you want to delete the task "${task.title}"?`}
            onConfirm={handleDeleteTask}
            onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}
    </>
  );
};
