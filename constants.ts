
import { ColumnData, Priority } from './types';

export const THEME_STORAGE_KEY = 'boardify-theme';
export const BOARDS_STORAGE_KEY = 'boardify-boards';
export const ACTIVE_BOARD_ID_STORAGE_KEY = 'boardify-activeBoardId';

export const DEFAULT_COLUMNS: Record<string, ColumnData> = {
  'column-1': { id: 'column-1', title: 'To Do', taskIds: [] },
  'column-2': { id: 'column-2', title: 'In Progress', taskIds: [], wipLimit: 3 }, // Example WIP Limit
  'column-3': { id: 'column-3', title: 'Done', taskIds: [] },
};

export const DEFAULT_COLUMN_ORDER = ['column-1', 'column-2', 'column-3'];

export const NEW_BOARD_ID_PREFIX = 'board-';
export const NEW_COLUMN_ID_PREFIX = 'column-';
export const NEW_TASK_ID_PREFIX = 'task-';

export const PRIORITY_LEVELS: Priority[] = ['none', 'low', 'medium', 'high', 'critical'];
export const DEFAULT_PRIORITY: Priority = 'none';

export const PRIORITY_MAP: Record<Priority, { label: string, color: string, iconColor: string }> = {
  none: { label: 'None', color: 'bg-gray-500 dark:bg-gray-600', iconColor: 'text-gray-500 dark:text-gray-400' },
  low: { label: 'Low', color: 'bg-green-500 dark:bg-green-600', iconColor: 'text-green-500 dark:text-green-400' },
  medium: { label: 'Medium', color: 'bg-blue-500 dark:bg-blue-600', iconColor: 'text-blue-500 dark:text-blue-400' },
  high: { label: 'High', color: 'bg-yellow-500 dark:bg-yellow-600', iconColor: 'text-yellow-500 dark:text-yellow-400' },
  critical: { label: 'Critical', color: 'bg-red-500 dark:bg-red-600', iconColor: 'text-red-500 dark:text-red-400' },
};
