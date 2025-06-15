export const defaultBoards = [
  {title: 'To Do', color: '#93c5fd'},
  {title: 'In Progress', color: '#fcd34d'},
  {title: 'Done', color: '#86efac'},
];

export const defaultTasks = [
  {
    id: 'default-1',
    title: 'Research project requirements',
    description: 'Gather information on project scope and deliverables',
    priority: 'high',
    dueDate: '2024-09-15', // Changed to a generic future date
    assignee: 'Alex',
    column: 0,
  },
  {
    id: 'default-2',
    title: 'Update documentation',
    description: 'Review and update existing documentation with latest changes',
    priority: 'medium',
    dueDate: '2024-10-01', // Changed to a generic future date
    assignee: 'Sam',
    column: 0,
  },
  {
    id: 'default-3',
    title: 'Plan team meeting',
    description: 'Prepare agenda and schedule next team sync',
    priority: 'low',
    // dueDate property removed
    assignee: 'Jordan',
    column: 0,
  },
  {
    id: 'default-4',
    title: 'Design new interface',
    description: 'Create mockups for the new dashboard layout',
    priority: 'high',
    dueDate: '2024-08-25', // Changed to a generic future date
    assignee: 'Taylor',
    column: 1,
  },
  {
    id: 'default-5',
    title: 'Fix navigation bug',
    description: 'Address issue with dropdown menu not working on mobile',
    priority: 'medium',
    // dueDate property removed
    assignee: 'Morgan',
    column: 1,
  },
  {
    id: 'default-6',
    title: 'Stakeholder review',
    description: 'Present initial concepts to project stakeholders',
    priority: 'high',
    dueDate: '2024-08-30', // Changed to a generic future date
    assignee: 'Jamie',
    column: 2,
  },
];
