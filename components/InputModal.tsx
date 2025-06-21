import React, { useState, useEffect, FormEvent } from 'react';
import { XIcon } from '../icons';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (inputValue: string) => void;
  title: string;
  label: string;
  initialValue?: string;
  placeholder?: string;
  submitText?: string;
  required?: boolean;
  requiredMessage?: string;
}

export const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  label,
  initialValue = '',
  placeholder = '',
  submitText = 'Submit',
  required = false,
  requiredMessage = 'This field is required.',
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue); // Reset when opening/reopening
      setError(null); // Clear previous errors
    }
  }, [isOpen, initialValue]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (required && !inputValue.trim()) {
      setError(requiredMessage);
      return;
    }
    setError(null);
    onSubmit(inputValue.trim()); // Submit trimmed value
    // onClose(); // Let the calling component decide to close, e.g. after successful async op
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn" role="dialog" aria-modal="true" aria-labelledby="input-modal-title">
      <div className="bg-white dark:bg-[#202020] p-6 rounded-lg shadow-xl w-full max-w-md animate-slideInUp">
        <div className="flex justify-between items-center mb-4">
          <h2 id="input-modal-title" className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Close modal">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label htmlFor="inputModalValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {label}
            </label>
            <input
              type="text"
              id="inputModalValue"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (error) setError(null); // Clear error on input change
              }}
              placeholder={placeholder}
              className={`block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`}
              autoFocus
              aria-required={required}
              aria-invalid={!!error}
              aria-describedby={error ? "input-modal-error" : undefined}
            />
            {error && <p id="input-modal-error" className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>}
          </div>
          <div className="flex justify-end space-x-3 mt-6">
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
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
