export type TourStepPlacement = 'top' | 'bottom' | 'left' | 'right'

export type TourStep = {
  id: string
  selector: string
  mobileSelector?: string
  title: string
  description: string
  placement: TourStepPlacement
  mobilePlacement?: TourStepPlacement
}

export const ONBOARDING_STEPS: TourStep[] = [
  {
    id: 'welcome-profile',
    selector: '[data-tour="welcome-profile"]',
    title: 'Your Profile',
    description:
      'This is your dashboard. You can see your name, role, and online status here. Click your avatar to upload a photo.',
    placement: 'bottom',
  },
  {
    id: 'status-dropdown',
    selector: '[data-tour="status-dropdown"]',
    title: 'Status & Shift',
    description:
      "Toggle your shift on/off and set your availability. Your teammates will see your status in real time.",
    placement: 'bottom',
  },
  {
    id: 'add-task',
    selector: '[data-tour="add-task"]',
    title: 'Add a Task',
    description:
      "Click here to create a new task. Describe what you're working on and pick a department.",
    placement: 'bottom',
  },
  {
    id: 'task-queue',
    selector: '[data-tour="task-queue"]',
    title: 'Your Task Queue',
    description:
      'All your active tasks appear here. Tip: double-click any queued task to instantly switch to it — this moves your current task back to the queue and starts the timer on the new one.',
    placement: 'top',
  },
  {
    id: 'current-task',
    selector: '[data-tour="current-task"]',
    title: 'Currently Working On',
    description:
      "Your active task is highlighted here with a live timer. Your team can see what you're working on.",
    placement: 'top',
  },
  {
    id: 'task-actions',
    selector: '[data-tour="task-actions"]',
    title: 'Task Actions',
    description:
      'Use the three-dot menu to edit, complete, or delete a task.',
    placement: 'left',
    mobilePlacement: 'top',
  },
  {
    id: 'team-sidebar',
    selector: '[data-tour="team-sidebar"]',
    mobileSelector: '[data-tour="team-sidebar-mobile"]',
    title: 'Your Team',
    description:
      "See who's online and what they're working on. Click the dots next to a teammate for details.",
    placement: 'left',
    mobilePlacement: 'top',
  },
  {
    id: 'completed-tasks',
    selector: '[data-tour="completed-tasks"]',
    title: 'Completed Tasks',
    description:
      'Your finished tasks are stored here. Expand to review them, and restore any task if needed.',
    placement: 'top',
  },
  {
    id: 'daily-report',
    selector: '[data-tour="current-task"]',
    title: 'Daily Activity Tracking',
    description:
      'Whatever task you set as active gets logged to your daily report automatically. If a task spans multiple days it will appear in each day\'s report. Admins can view these reports anytime under Admin Panel → Reports.',
    placement: 'top',
  },
]
