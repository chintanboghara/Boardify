
import React, { useContext, useState } from 'react';
import { BoardData, Task } from '../types';
import { Column } from './Column';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { BoardContext } from '../contexts/BoardContext';
import { PlusCircleIcon } from '../icons';
import { InputModal } from './InputModal'; // Import InputModal

interface BoardViewProps {
  board: BoardData;
}

export const BoardView: React.FC<BoardViewProps> = ({ board }) => {
  const { handleDragEnd, filteredTasks, addColumn, activeBoardId } = useContext(BoardContext);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);

  if (!board) return <div className="p-4 text-center">Board not found.</div>;

  const tasksToDisplayMap = filteredTasks.reduce((acc, task) => {
    acc[task.id] = task;
    return acc;
  }, {} as Record<string, Task>);

  const handleAddNewColumnSubmit = (columnName: string) => {
    if (!activeBoardId) return;
    if (columnName) { // InputModal already trims
      addColumn(activeBoardId, columnName);
    }
    setIsAddColumnModalOpen(false);
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="all-columns" direction="horizontal" type="COLUMN">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex space-x-4 h-full pb-4"
            >
              {board.columnOrder.map((columnId, index) => {
                const column = board.columns[columnId];
                if (!column) return null; 

                const columnTasks = column.taskIds
                  .map(taskId => tasksToDisplayMap[taskId]) 
                  .filter(task => !!task);

                return (
                  <Column
                    key={column.id}
                    column={column}
                    tasks={columnTasks}
                    index={index}
                    boardId={board.id}
                  />
                );
              })}
              {provided.placeholder}
              <div className="flex-shrink-0 w-80">
                <button
                  onClick={() => setIsAddColumnModalOpen(true)}
                  className="w-full h-12 flex items-center justify-center p-3 bg-gray-200 dark:bg-gray-700/50 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors duration-200"
                  aria-label="Add new column"
                >
                  <PlusCircleIcon className="w-6 h-6 mr-2" />
                  Add New Column
                </button>
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <InputModal
        isOpen={isAddColumnModalOpen}
        onClose={() => setIsAddColumnModalOpen(false)}
        onSubmit={handleAddNewColumnSubmit}
        title="Add New Column"
        label="Column Name"
        placeholder="e.g., Review"
        submitText="Add Column"
        required={true}
        requiredMessage="Column name cannot be empty."
      />
    </>
  );
};
