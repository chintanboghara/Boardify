/**
 * Default board configurations.
 * Default board configurations.
 * Each board object includes a title and now a themeId for styling.
 */
export const defaultBoards = [
  { title: 'To Do', themeId: 'ocean_blue' }, // Was blue, matches ocean_blue
  { title: 'In Progress', themeId: 'sunset_orange' }, // Was yellow/orange, matches sunset_orange
  { title: 'Done', themeId: 'forest_green' }, // Was green, matches forest_green
];

/**
 * Default tasks for initializing the application.
 * Each task contains details such as id, title, description, priority,
 * due date, assignee, and the associated board column index.
 */
export const defaultTasks = [
  {
    id: 'default-1',
    title: 'Research project requirements',
    description: 'Gather information on project scope and deliverables',
    priority: 'high',
    dueDate: '2025-02-20',
    assignee: 'Alex',
    column: 0,
    subtasks: [
      { id: 'sub-default-1-1', title: 'Identify key stakeholders', completed: true },
      { id: 'sub-default-1-2', title: 'Define success metrics', completed: false }
    ]
  },
  {
    id: 'default-2',
    title: 'Update documentation',
    description: 'Review and update existing documentation with latest changes',
    priority: 'medium',
    dueDate: '2025-02-22',
    assignee: 'Sam',
    column: 0,
  },
  {
    id: 'default-3',
    title: 'Plan team meeting',
    description: 'Prepare agenda and schedule next team sync',
    priority: 'low',
    dueDate: '2025-02-19',
    assignee: 'Jordan',
    column: 0,
  },
  {
    id: 'default-4',
    title: 'Design new interface',
    description: 'Create mockups for the new dashboard layout',
    priority: 'high',
    dueDate: '2025-02-18',
    assignee: 'Taylor',
    column: 1,
    subtasks: [
      { id: 'sub-default-4-1', title: 'Sketch wireframes', completed: false },
      { id: 'sub-default-4-2', title: 'Choose color palette', completed: false }
    ]
  },
  {
    id: 'default-5',
    title: 'Fix navigation bug',
    description: 'Address issue with dropdown menu not working on mobile',
    priority: 'medium',
    dueDate: '2025-02-19',
    assignee: 'Morgan',
    column: 1,
  },
  {
    id: 'default-6',
    title: 'Stakeholder review',
    description: 'Present initial concepts to project stakeholders',
    priority: 'high',
    dueDate: '2025-02-14',
    assignee: 'Jamie',
    column: 2,
  },
];

export const BOARD_THEMES = [
  {
    id: 'default_light',
    name: 'Default Light',
    colors: {
      headerBackground: '#e0e0e0', // Light Gray - similar to original default
      headerText: '#1f2937',      // Dark Gray text
      boardBackground: '#f9fafb', // Very Light Gray / White for task area
      accentColor: '#d1d5db',     // Medium Gray for border
    }
  },
  {
    id: 'default_dark_header', // A theme that might work with dark mode, focusing on header
    name: 'Dark Header',
    colors: {
      headerBackground: '#374151', // Dark Gray
      headerText: '#f9fafb',      // Light text
      boardBackground: '#1f2937', // Slightly lighter dark for task area (example)
      accentColor: '#4b5563',     // Medium-Dark Gray for border
    }
  },
  {
    id: 'ocean_blue',
    name: 'Ocean Blue',
    colors: {
      headerBackground: '#3b82f6', // Blue-500
      headerText: '#ffffff',      // White text
      boardBackground: '#eff6ff', // Blue-50 (very light blue)
      accentColor: '#60a5fa',     // Blue-400
    }
  },
  {
    id: 'forest_green',
    name: 'Forest Green',
    colors: {
      headerBackground: '#16a34a', // Green-600
      headerText: '#ffffff',      // White text
      boardBackground: '#f0fdf4', // Green-50 (very light green)
      accentColor: '#4ade80',     // Green-400
    }
  },
  {
    id: 'sunset_orange',
    name: 'Sunset Orange',
    colors: {
      headerBackground: '#f97316', // Orange-500
      headerText: '#ffffff',      // White text
      boardBackground: '#fff7ed', // Orange-50 (very light orange)
      accentColor: '#fb923c',     // Orange-400
    }
  },
  {
    id: 'charcoal_slate',
    name: 'Charcoal Slate',
    colors: {
      headerBackground: '#475569', // Slate-600
      headerText: '#f1f5f9',      // Slate-100 (light text)
      boardBackground: '#f1f5f9', // Slate-100 (for a lighter task area contrast)
      accentColor: '#64748b',     // Slate-500
    }
  }
];

export const DEFAULT_BOARD_THEME_ID = 'default_light';
