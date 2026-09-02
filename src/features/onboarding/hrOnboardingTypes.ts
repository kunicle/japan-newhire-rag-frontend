export interface HrOnboardingTask {
  taskId: number
  departmentId: number
  taskTitle: string
  taskDescription: string
  defaultDueDays: number
  active: boolean
  createdBy: number
  createdAt: string
  updatedAt: string
}

export interface OnboardingTaskFormInput {
  departmentId: number | null
  taskTitle: string
  taskDescription: string
  defaultDueDays: number
}

export interface OnboardingAssignmentCreateResult {
  onboardingTaskId: number
  requestedCount: number
  successCount: number
  duplicateCount: number
}
