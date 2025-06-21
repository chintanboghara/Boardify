
export type Priority = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  url: string;
  name?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  labels: string[];
  order: number;
  dueDate?: string; // ISO string for date
  priority?: Priority;
  subtasks?: Subtask[];
  attachments?: Attachment[];
  coverColor?: string; // Hex color code
  coverImageUrl?: string;
}

export interface ColumnData {
  id: string;
  title: string;
  taskIds: string[];
  wipLimit?: number; // Work-In-Progress Limit
  headerColor?: string; // Custom header color
}

export interface BoardData {
  id: string;
  name: string;
  columns: Record<string, ColumnData>;
  tasks: Record<string, Task>;
  columnOrder: string[];
  backgroundColor?: string;
  backgroundImageUrl?: string;
}

export type Theme = 'light' | 'dark';

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  retrievedContext?: {
    uri: string;
    title: string;
  };
}
