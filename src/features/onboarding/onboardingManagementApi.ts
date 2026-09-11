import { request } from '../../shared/api/httpClient'
import type {
  ManagedOnboardingTaskPage,
  OnboardingAssignableEmployee,
  OnboardingAssignmentCreateResult,
  OnboardingManagementItem,
  OnboardingManagementPage,
} from './onboardingManagementTypes'

export function fetchManagedOnboardingProgress(
  page = 0,
  size = 20,
  employeeId?: number,
): Promise<OnboardingManagementPage> {
  const employeeQuery = employeeId === undefined
    ? ''
    : `&employeeId=${employeeId}`
  return request<OnboardingManagementPage>(
    `/onboarding-management/progress?page=${page}&size=${size}${employeeQuery}`,
  )
}

export function fetchAssignableOnboardingEmployees(): Promise<OnboardingAssignableEmployee[]> {
  return request<OnboardingAssignableEmployee[]>(
    '/onboarding-management/employees',
  )
}

export function fetchManagedOnboardingTasks(
  page = 0,
  size = 100,
): Promise<ManagedOnboardingTaskPage> {
  return request<ManagedOnboardingTaskPage>(
    `/onboarding-management/tasks?page=${page}&size=${size}`,
  )
}

export function assignManagedOnboardingTask(
  taskId: number,
  employeeIds: number[],
): Promise<OnboardingAssignmentCreateResult> {
  return request<OnboardingAssignmentCreateResult>(
    `/onboarding-management/tasks/${taskId}/assignments`,
    {
      method: 'POST',
      body: JSON.stringify({ employeeIds }),
    },
  )
}

export function startManagedOnboarding(
  assignmentId: number,
): Promise<OnboardingManagementItem> {
  return request<OnboardingManagementItem>(
    `/onboarding-management/assignments/${assignmentId}/start`,
    { method: 'PATCH' },
  )
}

export function completeManagedOnboarding(
  assignmentId: number,
  completionNote: string | null = null,
): Promise<OnboardingManagementItem> {
  return request<OnboardingManagementItem>(
    `/onboarding-management/assignments/${assignmentId}/complete`,
    {
      method: 'PATCH',
      body: JSON.stringify({ completionNote }),
    },
  )
}
