
import React, { useContext, useState } from 'react';
import { Header } from './components/Header';
import { BoardView } from './components/BoardView';
import { ThemeContext } from './contexts/ThemeContext';
import { BoardContext } from './contexts/BoardContext';
import { AddIcon } from './icons';
import { InputModal } from './components/InputModal';

const App: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const { activeBoard, boards, createBoard } = useContext(BoardContext);
  const [isCreateFirstBoardModalOpen, setIsCreateFirstBoardModalOpen] = useState(false);

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleCreateFirstBoardSubmit = (boardName: string) => {
    if (boardName) {
      createBoard(boardName);
    }
    setIsCreateFirstBoardModalOpen(false);
  };

  const mainContentStyle: React.CSSProperties = {
    backgroundColor: activeBoard?.backgroundColor ? activeBoard.backgroundColor : undefined,
    backgroundImage: activeBoard?.backgroundImageUrl ? `url(${activeBoard.backgroundImageUrl})` : undefined,
    backgroundSize: activeBoard?.backgroundImageUrl ? 'cover' : undefined,
    backgroundPosition: activeBoard?.backgroundImageUrl ? 'center' : undefined,
    backgroundRepeat: activeBoard?.backgroundImageUrl ? 'no-repeat' : undefined,
  };

  return (
    <>
      <div className="flex flex-col h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Header />
        <main 
          className="flex-grow p-4 overflow-x-auto transition-all duration-300"
          style={mainContentStyle}
        >
          {activeBoard ? (
            <BoardView board={activeBoard} />
          ) : boards.length > 0 ? (
            <div className="flex flex-col items-center justify-center h-full bg-opacity-50 dark:bg-opacity-50 bg-gray-100 dark:bg-black p-4 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">No board selected.</h2>
              <p className="text-gray-600 dark:text-gray-400">Please select a board from the header or create a new one.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-opacity-50 dark:bg-opacity-50 bg-gray-100 dark:bg-black p-4 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Welcome to Boardify!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first Kanban board to start managing tasks.</p>
              <button
                onClick={() => setIsCreateFirstBoardModalOpen(true)}
                className="flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
              >
                <AddIcon className="w-5 h-5 mr-2" />
                Create First Board
              </button>
            </div>
          )}
        </main>
      </div>
      <InputModal
        isOpen={isCreateFirstBoardModalOpen}
        onClose={() => setIsCreateFirstBoardModalOpen(false)}
        onSubmit={handleCreateFirstBoardSubmit}
        title="Create Your First Board"
        label="Board Name"
        placeholder="e.g., My First Project"
        initialValue="My First Project"
        submitText="Create Board"
        required={true}
        requiredMessage="Board name cannot be empty."
      />
    </>
  );
};

export default App;
