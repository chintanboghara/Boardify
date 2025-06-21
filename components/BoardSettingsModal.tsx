
import React, { useState, useEffect, FormEvent } from 'react';
import { BoardData } from '../types';
import { XIcon, CircleSlashIcon, ImageIcon, PaletteIcon } from '../icons'; // Added ImageIcon, PaletteIcon

interface BoardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: BoardData | null;
  onSaveBackgroundColor: (boardId: string, color?: string) => void;
  onSaveBackgroundImageUrl: (boardId: string, url?: string) => void;
}

export const BoardSettingsModal: React.FC<BoardSettingsModalProps> = ({
  isOpen,
  onClose,
  board,
  onSaveBackgroundColor,
  onSaveBackgroundImageUrl,
}) => {
  const [backgroundColor, setBackgroundColor] = useState<string>('');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('');
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && board) {
      setBackgroundColor(board.backgroundColor || '');
      setBackgroundImageUrl(board.backgroundImageUrl || '');
      setUrlError(null);
    }
  }, [isOpen, board]);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!board) return;

    if (backgroundImageUrl) {
      try {
        new URL(backgroundImageUrl); // Basic URL validation
        setUrlError(null);
      } catch (_) {
        setUrlError("Invalid Background Image URL. Please enter a valid URL or leave it empty.");
        return;
      }
    } else {
        setUrlError(null);
    }

    onSaveBackgroundColor(board.id, backgroundColor || undefined);
    onSaveBackgroundImageUrl(board.id, backgroundImageUrl.trim() || undefined);
    onClose();
  };
  
  const handleClearBackgroundColor = () => {
    setBackgroundColor('');
  };

  const handleClearBackgroundImageUrl = () => {
    setBackgroundImageUrl('');
    setUrlError(null);
  };


  if (!isOpen || !board) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn" role="dialog" aria-modal="true" aria-labelledby="board-settings-modal-title">
      <div className="bg-white dark:bg-[#202020] p-6 rounded-lg shadow-xl w-full max-w-md animate-slideInUp">
        <div className="flex justify-between items-center mb-6">
          <h2 id="board-settings-modal-title" className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Board Settings: {board.name}
          </h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Close modal">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="boardBackgroundColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
              <PaletteIcon className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" /> Background Color
            </label>
            <div className="flex">
              <input
                type="color"
                id="boardBackgroundColor"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="p-0 h-10 w-full border border-gray-300 dark:border-gray-600 rounded-l-md cursor-pointer"
              />
              <button 
                type="button" 
                onClick={handleClearBackgroundColor} 
                title="Clear background color" 
                className="p-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <CircleSlashIcon className="w-5 h-5 text-gray-500 dark:text-gray-400"/>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="boardBackgroundImageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
              <ImageIcon className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" /> Background Image URL
            </label>
            <div className="flex">
              <input
                type="url"
                id="boardBackgroundImageUrl"
                value={backgroundImageUrl}
                onChange={(e) => { setBackgroundImageUrl(e.target.value); if(urlError) setUrlError(null); }}
                placeholder="https://example.com/image.jpg"
                className={`block w-full px-3 py-2 border ${urlError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`}
                aria-invalid={!!urlError}
                aria-describedby={urlError ? "bg-image-url-error" : undefined}
              />
              <button 
                type="button" 
                onClick={handleClearBackgroundImageUrl} 
                title="Clear background image URL" 
                className="p-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <CircleSlashIcon className="w-5 h-5 text-gray-500 dark:text-gray-400"/>
              </button>
            </div>
            {urlError && <p id="bg-image-url-error" className="text-xs text-red-500 dark:text-red-400 mt-1">{urlError}</p>}
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave empty for no image. Ensure the URL is publicly accessible.</p>
          </div>

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
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
