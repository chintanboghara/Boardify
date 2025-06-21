
import React, { useContext, useState } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { BoardContext } from '../contexts/BoardContext';
import { SunIcon, MoonIcon, SearchIcon, PlusIcon, DotsVerticalIcon, TrashIcon, PencilIcon, SettingsIcon } from '../icons';
import { IconButton } from './IconButton';
import { ConfirmationModal } from './ConfirmationModal';
import { InputModal } from './InputModal';
import { BoardSettingsModal } from './BoardSettingsModal'; // Import BoardSettingsModal

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { 
    boards, 
    activeBoard, 
    selectBoard, 
    createBoard, 
    searchTerm, 
    setSearchTerm, 
    deleteBoard, 
    updateBoardName,
    setBoardBackgroundColor, // Added
    setBoardBackgroundImageUrl // Added
  } = useContext(BoardContext);
  
  const [showBoardDropdown, setShowBoardDropdown] = useState(false);
  const [showBoardActions, setShowBoardActions] = useState<string | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);

  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [isRenameBoardModalOpen, setIsRenameBoardModalOpen] = useState(false);
  const [boardToRename, setBoardToRename] = useState<string | null>(null);
  const [initialRenameValue, setInitialRenameValue] = useState('');
  
  const [isBoardSettingsModalOpen, setIsBoardSettingsModalOpen] = useState(false); // New state


  const handleCreateBoardSubmit = (boardName: string) => {
    if (boardName) {
      createBoard(boardName);
    }
    setIsCreateBoardModalOpen(false);
    setShowBoardDropdown(false);
  };

  const handleSelectBoard = (boardId: string) => {
    selectBoard(boardId);
    setShowBoardDropdown(false);
  };

  const openDeleteBoardModal = (boardId: string) => {
    setBoardToDelete(boardId);
    setIsDeleteModalOpen(true);
    setShowBoardActions(null);
    setShowBoardDropdown(false);
  };

  const confirmDeleteBoard = () => {
    if (boardToDelete) {
      deleteBoard(boardToDelete);
    }
    setIsDeleteModalOpen(false);
    setBoardToDelete(null);
  };

  const openRenameBoardModal = (boardId: string) => {
    const currentBoard = boards.find(b => b.id === boardId);
    if (!currentBoard) return;
    setBoardToRename(boardId);
    setInitialRenameValue(currentBoard.name);
    setIsRenameBoardModalOpen(true);
    setShowBoardActions(null);
    setShowBoardDropdown(false);
  };
  
  const handleRenameBoardSubmit = (newName: string) => {
    if (boardToRename && newName && newName !== initialRenameValue) {
      updateBoardName(boardToRename, newName);
    }
    setIsRenameBoardModalOpen(false);
    setBoardToRename(null);
  };

  const openBoardSettingsModal = () => {
    if (activeBoard) {
        setIsBoardSettingsModalOpen(true);
        setShowBoardActions(null); // Close actions dropdown if open
        setShowBoardDropdown(false); // Close board dropdown if open
    }
  };


  return (
    <>
      <header className="bg-[#202020] dark:bg-black shadow-md p-4 flex items-center justify-between transition-colors duration-300">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-white">Boardify</h1>
          <div className="relative ml-6">
            <button 
              onClick={() => setShowBoardDropdown(!showBoardDropdown)}
              className="px-4 py-2 bg-gray-700 dark:bg-gray-800 text-white rounded-md hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors"
            >
              {activeBoard ? activeBoard.name : "Select Board"} <span className="ml-1">&#9662;</span>
            </button>
            {showBoardDropdown && (
              <div className="absolute mt-2 w-72 bg-white dark:bg-raisin-black rounded-md shadow-lg z-20 py-1 animate-fadeIn">
                {boards.map(board => (
                  <div key={board.id} className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                    <span onClick={() => handleSelectBoard(board.id)} className="flex-grow text-gray-800 dark:text-gray-200 truncate" title={board.name}>{board.name}</span>
                    <div className="relative">
                      <IconButton 
                        icon={<DotsVerticalIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
                        onClick={(e) => { e.stopPropagation(); setShowBoardActions(showBoardActions === board.id ? null : board.id); }}
                        tooltip="Board actions"
                        className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded-full"
                      />
                      {showBoardActions === board.id && (
                         <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-raisin-black rounded-md shadow-xl z-30 py-1 border border-gray-200 dark:border-gray-700">
                          <button onClick={() => openRenameBoardModal(board.id)} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                            <PencilIcon className="w-4 h-4 mr-2"/> Rename
                          </button>
                           {/* Add Board Settings if this is the active board */}
                           {activeBoard && activeBoard.id === board.id && (
                            <button onClick={openBoardSettingsModal} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                                <SettingsIcon className="w-4 h-4 mr-2"/> Board Settings
                            </button>
                           )}
                          <button onClick={() => openDeleteBoardModal(board.id)} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50">
                            <TrashIcon className="w-4 h-4 mr-2"/> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <button 
                  onClick={() => { setIsCreateBoardModalOpen(true); setShowBoardDropdown(false);}}
                  className="w-full text-left flex items-center px-4 py-2 text-blue-500 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <PlusIcon className="w-5 h-5 mr-2" /> Create New Board
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
            />
            <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
          <IconButton
            onClick={toggleTheme}
            icon={theme === 'light' ? <MoonIcon className="w-6 h-6 text-white" /> : <SunIcon className="w-6 h-6 text-yellow-400" />}
            tooltip={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            className="p-2 rounded-full hover:bg-gray-700 dark:hover:bg-gray-600"
          />
        </div>
      </header>
      
      {/* Modals */}
      <InputModal
        isOpen={isCreateBoardModalOpen}
        onClose={() => setIsCreateBoardModalOpen(false)}
        onSubmit={handleCreateBoardSubmit}
        title="Create New Board"
        label="Board Name"
        placeholder="e.g., Project Alpha"
        submitText="Create Board"
        required={true}
        requiredMessage="Board name cannot be empty."
      />
      <InputModal
        isOpen={isRenameBoardModalOpen}
        onClose={() => setIsRenameBoardModalOpen(false)}
        onSubmit={handleRenameBoardSubmit}
        title="Rename Board"
        label="New Board Name"
        initialValue={initialRenameValue}
        submitText="Rename Board"
        required={true}
        requiredMessage="Board name cannot be empty."
      />
      {isDeleteModalOpen && boardToDelete && (
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          title="Delete Board"
          message={`Are you sure you want to delete the board "${boards.find(b => b.id === boardToDelete)?.name || ''}"? This action cannot be undone.`}
          onConfirm={confirmDeleteBoard}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}
       {activeBoard && (
        <BoardSettingsModal
            isOpen={isBoardSettingsModalOpen}
            onClose={() => setIsBoardSettingsModalOpen(false)}
            board={activeBoard}
            onSaveBackgroundColor={setBoardBackgroundColor}
            onSaveBackgroundImageUrl={setBoardBackgroundImageUrl}
        />
       )}
    </>
  );
};
