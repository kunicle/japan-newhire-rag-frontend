import { request } from '../../shared/api/httpClient'
import type { MyOnboardingItem } from './onboardingTypes'

export function fetchMyOnboarding(): Promise<MyOnboardingItem[]> {
  return request<MyOnboardingItem[]>('/me/onboarding')
}

export function startOnboardingTask(
  assignmentId: number,
): Promise<MyOnboardingItem> {
  return request<MyOnboardingItem>(`/me/onboarding/${assignmentId}/start`, {
    method: 'PATCH',
  })
}

export function completeOnboardingTask(
  assignmentId: number,
): Promise<MyOnboardingItem> {
  return request<MyOnboardingItem>(`/me/onboarding/${assignmentId}/complete`, {
    method: 'PATCH',
    body: JSON.stringify({ completionNote: null }),
  })
}
