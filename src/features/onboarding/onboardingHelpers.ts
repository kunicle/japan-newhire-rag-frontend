import { AppError } from '../../shared/api/errors'
import type { BadgeProps } from '../../shared/ui'
import type { OnboardingCompletionStatus } from './onboardingTypes'

const DEFAULT_CONFLICT_MESSAGE = '현재 상태에서는 처리할 수 없습니다.'

export function onboardingStatusLabel(status: string): string {
  if (status === 'NOT_STARTED') return '시작 전'
  if (status === 'IN_PROGRESS') return '진행 중'
  if (status === 'COMPLETED') return '완료'
  return status
}

export function onboardingStatusBadgeVariant(
  status: OnboardingCompletionStatus,
): NonNullable<BadgeProps['variant']> {
  if (status === 'COMPLETED') return 'success'
  if (status === 'IN_PROGRESS') return 'info'
  return 'neutral'
}

export function mapOnboardingErrorMessage(
  error: unknown,
  fallback: string,
  conflictMessage: string = DEFAULT_CONFLICT_MESSAGE,
): string {
  if (!(error instanceof AppError)) return fallback
  if (error.status === 400) return '요청 정보를 확인해 주세요.'
  if (error.status === 403) return '본인의 온보딩 정보만 처리할 수 있습니다.'
  if (error.status === 404) return '요청한 온보딩 정보를 찾을 수 없습니다.'
  if (error.status === 409) return conflictMessage
  return fallback
}
