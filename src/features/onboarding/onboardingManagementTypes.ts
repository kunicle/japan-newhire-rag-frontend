import type {
  HrOnboardingTask,
  HrOnboardingTaskPage,
  OnboardingAssignmentCreateResult,
} from './hrOnboardingTypes'
import type {
  OnboardingAssignmentStatus,
  OnboardingCompletionStatus,
} from './onboardingTypes'

export interface OnboardingManagementItem {
  employeeId: number
  employeeName: string
  employeeDepartmentId: number
  employeeDepartmentName: string
  onboardingAssignmentId: number
  onboardingTaskId: number
  taskDepartmentId: number | null
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

export interface OnboardingManagementPage {
  content: OnboardingManagementItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export type {
  HrOnboardingTask as ManagedOnboardingTask,
  HrOnboardingTaskPage as ManagedOnboardingTaskPage,
  OnboardingAssignmentCreateResult,
}
