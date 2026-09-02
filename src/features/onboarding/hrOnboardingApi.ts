import { request } from '../../shared/api/httpClient'
import type {
  HrOnboardingTask,
  OnboardingAssignmentCreateResult,
  OnboardingTaskFormInput,
} from './hrOnboardingTypes'

export function createOnboardingTask(
  input: OnboardingTaskFormInput,
): Promise<HrOnboardingTask> {
  return request<HrOnboardingTask>('/hr/onboarding-tasks', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateOnboardingTask(
  taskId: number,
  input: OnboardingTaskFormInput,
): Promise<HrOnboardingTask> {
  return request<HrOnboardingTask>(`/hr/onboarding-tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function changeOnboardingTaskActivation(
  taskId: number,
  active: boolean,
): Promise<HrOnboardingTask> {
  return request<HrOnboardingTask>(`/hr/onboarding-tasks/${taskId}/activation`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  })
}

export function assignOnboardingTask(
  taskId: number,
  employeeIds: number[],
): Promise<OnboardingAssignmentCreateResult> {
  return request<OnboardingAssignmentCreateResult>(
    `/hr/onboarding-tasks/${taskId}/assignments`,
    {
      method: 'POST',
      body: JSON.stringify({ employeeIds }),
    },
  )
}
