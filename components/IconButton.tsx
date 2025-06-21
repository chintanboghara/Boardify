
import React, { ReactNode } from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  tooltip?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({ icon, tooltip, className, ...props }) => {
  return (
    <button
      type="button"
      className={`relative group ${className || 'p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'}`}
      {...props}
    >
      {icon}
      {tooltip && (
        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-200 dark:text-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
          {tooltip}
        </span>
      )}
    </button>
  );
};
