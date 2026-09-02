export type OnboardingAssignmentStatus =
  | 'ASSIGNED'
  | 'CANCELLED'
  | 'COMPLETED'

export type OnboardingCompletionStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'

export interface MyOnboardingItem {
  onboardingAssignmentId: number
  onboardingTaskId: number
  departmentId: number
  taskTitle: string
  taskDescription: string
  assignedDate: string
  dueDate: string
  assignmentStatus: OnboardingAssignmentStatus
  completionStatus: OnboardingCompletionStatus
  completionNote: string | null
  completedAt: string | null
  overdue: boolean
}
