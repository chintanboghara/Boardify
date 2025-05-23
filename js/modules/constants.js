/**
 * Default board configurations.
 * Each board object includes a title and a color for styling.
 */
export const defaultBoards = [
  { title: 'To Do', color: '#93c5fd' },
  { title: 'In Progress', color: '#fcd34d' },
  { title: 'Done', color: '#86efac' },
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
