
import React, { createContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { BoardData, Task, ColumnData } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { BOARDS_STORAGE_KEY, ACTIVE_BOARD_ID_STORAGE_KEY, DEFAULT_COLUMNS, DEFAULT_COLUMN_ORDER, NEW_BOARD_ID_PREFIX, NEW_COLUMN_ID_PREFIX, NEW_TASK_ID_PREFIX } from '../constants';
import { v4 as uuidv4 } from 'uuid';
import { DropResult } from 'react-beautiful-dnd';

interface BoardContextType {
  boards: BoardData[];
  activeBoard: BoardData | null;
  activeBoardId: string | null;
  filteredTasks: Task[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isLoading: boolean;
  createBoard: (name: string) => void;
  selectBoard: (boardId: string) => void;
  updateBoardName: (boardId: string, newName: string) => void;
  deleteBoard: (boardId: string) => void;
  addTask: (boardId: string, columnId: string, taskData: Omit<Task, 'id' | 'order'>) => void;
  updateTask: (boardId: string, taskId: string, updatedData: Partial<Task>) => void;
  deleteTask: (boardId: string, taskId: string, columnId: string) => void;
  addColumn: (boardId: string, title: string) => void;
  renameColumn: (boardId: string, columnId: string, newTitle: string) => void;
  deleteColumn: (boardId: string, columnId: string) => void;
  setColumnWipLimit: (boardId: string, columnId: string, limit?: number) => void;
  setColumnHeaderColor: (boardId: string, columnId: string, color?: string) => void;
  setBoardBackgroundColor: (boardId: string, color?: string) => void;
  setBoardBackgroundImageUrl: (boardId: string, url?: string) => void;
  handleDragEnd: (result: DropResult) => void;
}

export const BoardContext = createContext<BoardContextType>({} as BoardContextType);

interface BoardProviderProps {
  children: ReactNode;
}

export const BoardProvider: React.FC<BoardProviderProps> = ({ children }) => {
  const [boards, setBoards] = useLocalStorage<BoardData[]>(BOARDS_STORAGE_KEY, []);
  const [activeBoardId, setActiveBoardId] = useLocalStorage<string | null>(ACTIVE_BOARD_ID_STORAGE_KEY, null);
  const [activeBoard, setActiveBoard] = useState<BoardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  useEffect(() => {
    setIsLoading(true);
    let newActiveBoard: BoardData | null = null;
    let newActiveBoardId: string | null = activeBoardId;

    if (boards.length === 0) {
        newActiveBoard = null;
        newActiveBoardId = null;
    } else { // boards.length > 0
        if (activeBoardId) {
            const foundBoard = boards.find(b => b.id === activeBoardId);
            if (foundBoard) {
                newActiveBoard = foundBoard;
                // newActiveBoardId remains activeBoardId
            } else { // activeBoardId is stale/invalid
                newActiveBoard = boards[0];
                newActiveBoardId = boards[0].id;
            }
        } else { // No activeBoardId, but boards exist
            newActiveBoard = boards[0];
            newActiveBoardId = boards[0].id;
        }
    }
    
    setActiveBoard(newActiveBoard);
    // Only call setActiveBoardId if the determined ID is different from the current one in local storage
    // This prevents an unnecessary write to localStorage and an extra re-render cycle if the ID is already correct.
    if (newActiveBoardId !== activeBoardId) { 
         setActiveBoardId(newActiveBoardId);
    }
    setIsLoading(false);
  }, [activeBoardId, boards, setActiveBoardId]); // setActiveBoardId is included as it's a setter from useLocalStorage

   useEffect(() => {
    if (!activeBoard) {
      setFilteredTasks([]);
      return;
    }
    const allTasks = Object.values(activeBoard.tasks);
    let tasksToSet: Task[];

    if (!searchTerm) {
      tasksToSet = allTasks;
    } else {
      const lowerSearchTerm = searchTerm.toLowerCase();
      tasksToSet = allTasks.filter(task =>
        task.title.toLowerCase().includes(lowerSearchTerm) ||
        task.labels.some(label => label.toLowerCase().includes(lowerSearchTerm)) ||
        (task.priority && task.priority.toLowerCase().includes(lowerSearchTerm)) ||
        (task.description && task.description.toLowerCase().includes(lowerSearchTerm))
      );
    }
    setFilteredTasks(tasksToSet.sort((a, b) => a.order - b.order));
  }, [searchTerm, activeBoard]);


  const createBoard = useCallback((name: string) => {
    const newBoardId = `${NEW_BOARD_ID_PREFIX}${uuidv4()}`;
    const defaultColsCopy = JSON.parse(JSON.stringify(DEFAULT_COLUMNS));
    const defaultColOrderCopy = [...DEFAULT_COLUMN_ORDER];

    const newBoard: BoardData = {
      id: newBoardId,
      name,
      columns: defaultColsCopy, 
      tasks: {},
      columnOrder: defaultColOrderCopy,
      backgroundColor: undefined, 
      backgroundImageUrl: undefined,
    };

    setBoards(prevBoards => {
      const updatedBoards = [...prevBoards, newBoard];
      if (prevBoards.length === 0 || !activeBoardId) { 
        // This will trigger the useEffect for active board selection
        setActiveBoardId(newBoardId);
      }
      return updatedBoards;
    });
  }, [activeBoardId, setActiveBoardId, setBoards]);

  const selectBoard = useCallback((boardId: string) => {
    setActiveBoardId(boardId);
  }, [setActiveBoardId]);

  const updateBoardName = useCallback((boardId: string, newName: string) => {
    setBoards(prev => prev.map(b => b.id === boardId ? { ...b, name: newName } : b));
  }, [setBoards]);

  const deleteBoard = useCallback((boardId: string) => {
    setBoards(prevBoards => {
        const newBoards = prevBoards.filter(b => b.id !== boardId);
        if (activeBoardId === boardId) {
            // The useEffect for active board selection will handle picking a new active board or clearing it.
            // We just need to ensure activeBoardId might change to trigger it if it was the deleted one.
            setActiveBoardId(newBoards.length > 0 ? newBoards[0].id : null);
        }
        return newBoards;
    });
  }, [activeBoardId, setActiveBoardId, setBoards]);

  const addTask = useCallback((boardId: string, columnId: string, taskData: Omit<Task, 'id' | 'order'>) => {
    setBoards(prevBoards => {
      return prevBoards.map(board => {
        if (board.id === boardId) {
          const newTaskId = `${NEW_TASK_ID_PREFIX}${uuidv4()}`;
          const columnTasks = board.columns[columnId].taskIds.map(id => board.tasks[id]).filter(Boolean);
          const maxOrder = columnTasks.length > 0 ? Math.max(...columnTasks.map(t => t.order)) : -1;
          
          const newTask: Task = { 
            ...taskData, 
            id: newTaskId, 
            order: maxOrder + 1,
            subtasks: taskData.subtasks || [],
            attachments: taskData.attachments || [],
          };
          
          return {
            ...board,
            tasks: { ...board.tasks, [newTaskId]: newTask },
            columns: {
              ...board.columns,
              [columnId]: {
                ...board.columns[columnId],
                taskIds: [...board.columns[columnId].taskIds, newTaskId],
              },
            },
          };
        }
        return board;
      });
    });
  }, [setBoards]);

  const updateTask = useCallback((boardId: string, taskId: string, updatedData: Partial<Task>) => {
     setBoards(prevBoards => {
      return prevBoards.map(board => {
        if (board.id === boardId && board.tasks[taskId]) {
          const existingTask = board.tasks[taskId];
          return {
            ...board,
            tasks: {
              ...board.tasks,
              [taskId]: { 
                ...existingTask, 
                ...updatedData,
                labels: updatedData.labels !== undefined ? updatedData.labels : existingTask.labels,
                subtasks: updatedData.subtasks !== undefined ? updatedData.subtasks : existingTask.subtasks,
                attachments: updatedData.attachments !== undefined ? updatedData.attachments : existingTask.attachments,
              },
            },
          };
        }
        return board;
      });
    });
  }, [setBoards]);

  const deleteTask = useCallback((boardId: string, taskId: string, columnId: string) => {
    setBoards(prevBoards => {
      return prevBoards.map(board => {
        if (board.id === boardId) {
          const newTasks = { ...board.tasks };
          delete newTasks[taskId];

          const newColumn = {
            ...board.columns[columnId],
            taskIds: board.columns[columnId].taskIds.filter(id => id !== taskId),
          };
          // Re-order tasks in the affected column
          newColumn.taskIds.forEach((tId, index) => {
            if (newTasks[tId]) {
              newTasks[tId].order = index;
            }
          });
          
          return {
            ...board,
            tasks: newTasks,
            columns: { ...board.columns, [columnId]: newColumn },
          };
        }
        return board;
      });
    });
  }, [setBoards]);

  const addColumn = useCallback((boardId: string, title: string) => {
    setBoards(prevBoards => prevBoards.map(board => {
      if (board.id === boardId) {
        const newColumnId = `${NEW_COLUMN_ID_PREFIX}${uuidv4()}`;
        const newColumn: ColumnData = { id: newColumnId, title, taskIds: [], headerColor: undefined };
        return {
          ...board,
          columns: { ...board.columns, [newColumnId]: newColumn },
          columnOrder: [...board.columnOrder, newColumnId],
        };
      }
      return board;
    }));
  }, [setBoards]);

  const renameColumn = useCallback((boardId: string, columnId: string, newTitle: string) => {
    setBoards(prevBoards => prevBoards.map(board => {
      if (board.id === boardId && board.columns[columnId]) {
        return {
          ...board,
          columns: { ...board.columns, [columnId]: { ...board.columns[columnId], title: newTitle } },
        };
      }
      return board;
    }));
  }, [setBoards]);

  const deleteColumn = useCallback((boardId: string, columnId: string) => {
    setBoards(prevBoards => prevBoards.map(board => {
      if (board.id === boardId && board.columns[columnId]) {
        const tasksToDelete = board.columns[columnId].taskIds;
        const newTasks = { ...board.tasks };
        tasksToDelete.forEach(taskId => delete newTasks[taskId]);
        
        const newColumns = { ...board.columns };
        delete newColumns[columnId];
        
        const newColumnOrder = board.columnOrder.filter(id => id !== columnId);
        
        return {
          ...board,
          tasks: newTasks,
          columns: newColumns,
          columnOrder: newColumnOrder,
        };
      }
      return board;
    }));
  }, [setBoards]);

  const setColumnWipLimit = useCallback((boardId: string, columnId: string, limit?: number) => {
    setBoards(prevBoards => prevBoards.map(board => {
      if (board.id === boardId && board.columns[columnId]) {
        return {
          ...board,
          columns: { ...board.columns, [columnId]: { ...board.columns[columnId], wipLimit: limit } },
        };
      }
      return board;
    }));
  }, [setBoards]);

  const setColumnHeaderColor = useCallback((boardId: string, columnId: string, color?: string) => {
    setBoards(prevBoards => prevBoards.map(board => {
      if (board.id === boardId && board.columns[columnId]) {
        return {
          ...board,
          columns: { ...board.columns, [columnId]: { ...board.columns[columnId], headerColor: color } },
        };
      }
      return board;
    }));
  }, [setBoards]);

  const setBoardBackgroundColor = useCallback((boardId: string, color?: string) => {
    setBoards(prevBoards => prevBoards.map(board => 
      board.id === boardId ? { ...board, backgroundColor: color } : board
    ));
  }, [setBoards]);

  const setBoardBackgroundImageUrl = useCallback((boardId: string, url?: string) => {
    setBoards(prevBoards => prevBoards.map(board => 
      board.id === boardId ? { ...board, backgroundImageUrl: url } : board
    ));
  }, [setBoards]);
  
  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    if (!activeBoard) return;

    setBoards(prevBoards => {
      return prevBoards.map(currentBoardState => {
        if (currentBoardState.id !== activeBoard.id) return currentBoardState;

        let newBoard = { ...currentBoardState };

        if (type === 'COLUMN') {
          const newColumnOrder = Array.from(newBoard.columnOrder);
          newColumnOrder.splice(source.index, 1);
          newColumnOrder.splice(destination.index, 0, draggableId);
          newBoard = { ...newBoard, columnOrder: newColumnOrder };
        } else if (type === 'TASK') {
          const startColumn = newBoard.columns[source.droppableId];
          const finishColumn = newBoard.columns[destination.droppableId];

          if (!startColumn || !finishColumn) return currentBoardState; 

          const newTasksState = { ...newBoard.tasks };

          if (startColumn.id === finishColumn.id) { 
            const newTaskIds = Array.from(startColumn.taskIds);
            newTaskIds.splice(source.index, 1);
            newTaskIds.splice(destination.index, 0, draggableId);

            const updatedColumn = { ...startColumn, taskIds: newTaskIds };
            
            newTaskIds.forEach((taskId, index) => {
              if (newTasksState[taskId]) newTasksState[taskId].order = index;
            });

            newBoard = {
              ...newBoard,
              columns: { ...newBoard.columns, [startColumn.id]: updatedColumn },
              tasks: newTasksState,
            };
          } else { 
            const startTaskIds = Array.from(startColumn.taskIds);
            startTaskIds.splice(source.index, 1);
            const updatedStartColumn = { ...startColumn, taskIds: startTaskIds };

            const finishTaskIds = Array.from(finishColumn.taskIds);
            finishTaskIds.splice(destination.index, 0, draggableId);
            const updatedFinishColumn = { ...finishColumn, taskIds: finishTaskIds };
            
            startTaskIds.forEach((taskId, index) => { 
              if (newTasksState[taskId]) newTasksState[taskId].order = index;
            });
            finishTaskIds.forEach((taskId, index) => {
               if (newTasksState[taskId]) newTasksState[taskId].order = index;
            });

            newBoard = {
              ...newBoard,
              columns: {
                ...newBoard.columns,
                [startColumn.id]: updatedStartColumn,
                [finishColumn.id]: updatedFinishColumn,
              },
              tasks: newTasksState,
            };
          }
        }
        return newBoard;
      });
    });
  }, [activeBoard, setBoards]);


  return (
    <BoardContext.Provider value={{
      boards,
      activeBoard,
      activeBoardId,
      filteredTasks,
      searchTerm,
      setSearchTerm,
      isLoading,
      createBoard,
      selectBoard,
      updateBoardName,
      deleteBoard,
      addTask,
      updateTask,
      deleteTask,
      addColumn,
      renameColumn,
      deleteColumn,
      setColumnWipLimit,
      setColumnHeaderColor,
      setBoardBackgroundColor,
      setBoardBackgroundImageUrl,
      handleDragEnd,
    }}>
      {children}
    </BoardContext.Provider>
  );
};
