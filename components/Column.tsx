
import React, { useState, useContext, useEffect, useRef } from 'react';
import { ColumnData, Task } from '../types';
import { TaskCard } from './TaskCard';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { TaskModal } from './TaskModal';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XIcon, PaletteIcon, CircleSlashIcon } from '../icons';
import { BoardContext } from '../contexts/BoardContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { IconButton } from './IconButton';
import { ConfirmationModal } from './ConfirmationModal';
import { getContrastYIQ } from '../utils'; 

interface ColumnProps {
  column: ColumnData;
  tasks: Task[];
  index: number;
  boardId: string;
}

export const Column: React.FC<ColumnProps> = ({ column, tasks, index, boardId }) => {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(column.title);
  const [isEditingWip, setIsEditingWip] = useState(false);
  const [editingWip, setEditingWip] = useState<string>(column.wipLimit?.toString() || '');
  
  const [isDeleteColumnModalOpen, setIsDeleteColumnModalOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [selectedColumnColor, setSelectedColumnColor] = useState(column.headerColor || '');


  const { addTask, renameColumn, deleteColumn, setColumnWipLimit, setColumnHeaderColor } = useContext(BoardContext);
  const { theme } = useContext(ThemeContext);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const wipInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    setEditingTitle(column.title);
  }, [column.title]);

  useEffect(() => {
    setEditingWip(column.wipLimit?.toString() || '');
  }, [column.wipLimit]);
  
  useEffect(() => {
    setSelectedColumnColor(column.headerColor || '');
  }, [column.headerColor]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingWip && wipInputRef.current) {
      wipInputRef.current.focus();
      wipInputRef.current.select();
    }
  }, [isEditingWip]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setIsColorPickerOpen(false);
      }
    };
    if (isColorPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isColorPickerOpen]);


  const handleAddTask = (taskData: Omit<Task, 'id' | 'order'>) => {
    addTask(boardId, column.id, taskData);
  };

  const handleRenameSubmit = () => {
    if (editingTitle.trim() && editingTitle.trim() !== column.title) {
      renameColumn(boardId, column.id, editingTitle.trim());
    }
    setIsEditingTitle(false);
  };
  
  const handleWipSubmit = () => {
    const limit = parseInt(editingWip, 10);
    if (!isNaN(limit) && limit >= 0) {
      setColumnWipLimit(boardId, column.id, limit);
    } else if (editingWip.trim() === '') {
      setColumnWipLimit(boardId, column.id, undefined);
    }
    setIsEditingWip(false);
  };

  const handleDeleteColumn = () => {
    deleteColumn(boardId, column.id);
    setIsDeleteColumnModalOpen(false);
  };

  const handleSetColumnColor = () => {
    setColumnHeaderColor(boardId, column.id, selectedColumnColor || undefined);
    setIsColorPickerOpen(false);
  };

  const handleClearColumnColor = () => {
    setSelectedColumnColor(''); 
    setColumnHeaderColor(boardId, column.id, undefined);
    setIsColorPickerOpen(false);
  };

  const isWipLimitDefined = column.wipLimit !== undefined;
  const wipLimitExceeded = isWipLimitDefined && tasks.length > column.wipLimit!;
  const isWipLimitMetOrExceeded = isWipLimitDefined && tasks.length >= column.wipLimit!;
  
  let headerTextColor = theme === 'dark' ? 'text-gray-100' : 'text-white';
  // Determine text color based on actual header background (custom or default)
  const actualHeaderBgForContrast = column.headerColor 
    ? column.headerColor 
    : (theme === 'dark' ? '#1F2937' /* gray-800 */ : '#202020'); // Use actual hex for default

  if (column.headerColor) { // If custom color is set, use it for contrast calculation
     headerTextColor = getContrastYIQ(column.headerColor) === 'dark' ? 'text-gray-900' : 'text-white';
  } else { // If no custom color, calculate based on theme's default column header
     headerTextColor = getContrastYIQ(theme === 'dark' ? '#1F2937' : '#202020') === 'dark' ? 'text-gray-900' : 'text-white';
  }


  return (
    <>
      <Draggable draggableId={column.id} index={index}>
        {(providedDraggable, snapshot) => (
          <div
            {...providedDraggable.draggableProps}
            ref={providedDraggable.innerRef}
            className={`rounded-lg w-80 flex flex-col flex-shrink-0 h-full max-h-[calc(100vh-10rem)] transition-all duration-150 ease-in-out ${
              snapshot.isDragging 
                ? 'shadow-2xl scale-[1.02] ring-2 ring-blue-500 z-50' 
                : 'shadow-lg'
            } ${
              wipLimitExceeded ? 'ring-2 ring-red-500' : ''
            } ${
              column.headerColor ? '' : (theme === 'dark' ? 'bg-gray-800' : 'bg-[#202020]')
            }`}
            style={column.headerColor ? { 
                ...providedDraggable.draggableProps.style, 
                backgroundColor: column.headerColor, 
                borderColor: column.headerColor 
              } : providedDraggable.draggableProps.style
            }
          >
            <div 
              {...providedDraggable.dragHandleProps}
              className={`p-3 border-b flex items-center justify-between ${headerTextColor} ${
                wipLimitExceeded ? (column.headerColor && snapshot.isDragging ? 'bg-opacity-70' : 'bg-red-700/30 dark:bg-red-900/30') : ''
              } ${column.headerColor ? '' : (theme === 'dark' ? 'border-gray-700' : 'border-gray-300')}`}
               style={column.headerColor ? { backgroundColor: column.headerColor } : {}} // Header also gets custom color if set
            >
              {isEditingTitle ? (
                <div className="flex-grow flex items-center">
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                    className={`flex-grow p-1 -ml-1 text-xl font-semibold bg-transparent border border-blue-500 rounded focus:outline-none ${headerTextColor}`}
                  />
                  <IconButton icon={<CheckIcon className="w-5 h-5 text-green-500"/>} onClick={handleRenameSubmit} tooltip="Save title" className="ml-1"/>
                  <IconButton icon={<XIcon className="w-5 h-5 text-red-500"/>} onClick={() => { setIsEditingTitle(false); setEditingTitle(column.title);}} tooltip="Cancel" className="ml-1"/>
                </div>
              ) : (
                <h3 className="text-xl font-semibold cursor-grab truncate" title={column.title}>
                  {column.title}
                </h3>
              )}
              <div className="flex items-center space-x-1 ml-2 flex-shrink-0 relative">
                {!isEditingTitle && <IconButton icon={<PencilIcon className={`w-4 h-4 ${headerTextColor}`} />} onClick={() => setIsEditingTitle(true)} tooltip="Rename column" />}
                <IconButton 
                  icon={<PaletteIcon className={`w-4 h-4 ${headerTextColor}`} />} 
                  onClick={(e) => { e.stopPropagation(); setIsColorPickerOpen(!isColorPickerOpen);}} 
                  tooltip="Set column color" 
                />
                <IconButton icon={<TrashIcon className="w-4 h-4 text-red-400 hover:text-red-300" />} onClick={() => setIsDeleteColumnModalOpen(true)} tooltip="Delete column" />
                {isColorPickerOpen && (
                    <div ref={colorPickerRef} className="absolute top-full right-0 mt-1 p-3 bg-white dark:bg-gray-700 rounded shadow-lg z-20 border dark:border-gray-600 space-y-2 w-48">
                        <label htmlFor={`color-picker-${column.id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300">Header Color:</label>
                        <input
                            type="color"
                            id={`color-picker-${column.id}`}
                            value={selectedColumnColor}
                            onChange={(e) => setSelectedColumnColor(e.target.value)}
                            className="w-full h-8 border-gray-300 dark:border-gray-500 rounded cursor-pointer"
                        />
                        <div className="flex justify-between space-x-2">
                           <button onClick={handleSetColumnColor} className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">Save</button>
                           <button onClick={handleClearColumnColor} className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-500 text-gray-800 dark:text-gray-100 rounded hover:bg-gray-400 dark:hover:bg-gray-600">Clear</button>
                        </div>
                    </div>
                )}
              </div>
            </div>
            {/* If a custom headerColor is set, the body of the column should NOT revert to default dark theme background */}
            <div className={`flex flex-col flex-grow ${column.headerColor ? '' : (theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200') }`}>
                <div className={`px-3 py-1 text-xs flex justify-between items-center border-b ${column.headerColor ? (getContrastYIQ(column.headerColor) === 'dark' ? 'text-gray-700 border-gray-400' : 'text-gray-300 border-gray-600') : (theme === 'dark' ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-300') }`}>
                <span>
                    Tasks: {tasks.length}
                    {column.wipLimit !== undefined ? ` / ${column.wipLimit}` : ' / ∞'}
                </span>
                {isEditingWip ? (
                    <div className="flex items-center">
                        <input
                        ref={wipInputRef}
                        type="number"
                        min="0"
                        value={editingWip}
                        onChange={(e) => setEditingWip(e.target.value)}
                        onBlur={handleWipSubmit}
                        onKeyDown={(e) => e.key === 'Enter' && handleWipSubmit()}
                        placeholder="Limit"
                        className={`w-12 p-0.5 text-xs bg-transparent border border-blue-500 rounded text-center focus:outline-none ${column.headerColor ? (getContrastYIQ(column.headerColor) === 'dark' ? 'text-gray-900' : 'text-white') : (theme === 'dark' ? 'text-gray-200' : 'text-gray-700')}`}
                        />
                        <IconButton icon={<CheckIcon className="w-4 h-4 text-green-500"/>} onClick={handleWipSubmit} tooltip="Set WIP" className="ml-1 p-0.5"/>
                        <IconButton icon={<XIcon className="w-4 h-4 text-red-500"/>} onClick={() => {setIsEditingWip(false); setEditingWip(column.wipLimit?.toString() || '');}} tooltip="Cancel" className="ml-1 p-0.5"/>
                    </div>
                ) : (
                    <IconButton icon={<PencilIcon className="w-3 h-3" />} onClick={() => setIsEditingWip(true)} tooltip="Set WIP Limit" className="p-0.5"/>
                )}
                </div>
                <Droppable droppableId={column.id} type="TASK">
                {(providedDroppable, snapshotDroppable) => (
                    <div
                    ref={providedDroppable.innerRef}
                    {...providedDroppable.droppableProps}
                    className={`p-3 flex-grow overflow-y-auto min-h-[100px] ${snapshotDroppable.isDraggingOver ? (column.headerColor ? 'bg-black/10 dark:bg-black/20' : 'bg-blue-900/20 dark:bg-blue-900/30') : ''} transition-colors duration-200`}
                    >
                    {tasks.map((task, taskIndex) => (
                        <TaskCard key={task.id} task={task} index={taskIndex} boardId={boardId} columnId={column.id} />
                    ))}
                    {providedDroppable.placeholder}
                    </div>
                )}
                </Droppable>
                <div className={`p-3 border-t ${column.headerColor ? (getContrastYIQ(column.headerColor) === 'dark' ? 'border-gray-400' : 'border-gray-600') : (theme === 'dark' ? 'border-gray-700' : 'border-gray-300')}`}>
                <button
                    onClick={() => setIsTaskModalOpen(true)}
                    className={`w-full flex items-center justify-center py-2 px-4 rounded-md transition-colors duration-200 ${
                    isWipLimitMetOrExceeded
                        ? 'bg-gray-400 dark:bg-gray-600 text-gray-700 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                    disabled={isWipLimitMetOrExceeded}
                    title={isWipLimitMetOrExceeded ? "WIP limit met or exceeded for this column" : "Add new task"}
                >
                    <PlusIcon className="w-5 h-5 mr-2" /> Add Task
                </button>
                </div>
            </div>
            {isTaskModalOpen && (
              <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSave={handleAddTask}
                boardId={boardId}
                columnId={column.id}
              />
            )}
          </div>
        )}
      </Draggable>
      {isDeleteColumnModalOpen && (
        <ConfirmationModal
          isOpen={isDeleteColumnModalOpen}
          title={`Delete Column "${column.title}"`}
          message={
            <>
              <p>Are you sure you want to delete this column?</p>
              {column.taskIds.length > 0 && (
                <p className="font-semibold text-red-500 dark:text-red-400 mt-2">
                  This column contains {column.taskIds.length} task(s). Deleting the column will also delete all tasks within it. This action cannot be undone.
                </p>
              )}
            </>
          }
          onConfirm={handleDeleteColumn}
          onCancel={() => setIsDeleteColumnModalOpen(false)}
          confirmText="Delete Column"
        />
      )}
    </>
  );
};
