import type { BadgeProps } from '../../shared/ui'
import { AppError } from '../../shared/api/errors'
import type {
  EnrollmentStatus,
  LearningCompletionStatus,
} from './educationTypes'

export function enrollmentStatusLabel(status: EnrollmentStatus | string): string {
  if (status === 'NOT_STARTED') return '시작 전'
  if (status === 'IN_PROGRESS') return '진행 중'
  if (status === 'COMPLETED') return '완료'
  if (status === 'OVERDUE') return '기한 초과'
  return status
}

export function moduleStatusLabel(
  status: LearningCompletionStatus | string,
): string {
  if (status === 'NOT_STARTED') return '시작 전'
  if (status === 'IN_PROGRESS') return '진행 중'
  if (status === 'COMPLETED') return '완료'
  return status
}

export function enrollmentStatusBadgeVariant(
  status: EnrollmentStatus,
): NonNullable<BadgeProps['variant']> {
  if (status === 'COMPLETED') return 'success'
  if (status === 'OVERDUE') return 'danger'
  if (status === 'IN_PROGRESS') return 'info'
  return 'neutral'
}

export function moduleStatusBadgeVariant(
  status: LearningCompletionStatus,
): NonNullable<BadgeProps['variant']> {
  if (status === 'COMPLETED') return 'success'
  if (status === 'IN_PROGRESS') return 'info'
  return 'neutral'
}

export function mapEducationErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!(error instanceof AppError)) return fallback
  if (error.status === 403) return '본인의 교육 과정만 확인할 수 있습니다.'
  if (error.status === 404) return '요청한 교육 정보를 찾을 수 없습니다.'
  if (error.status === 400) return '요청 정보를 확인해 주세요.'
  if (error.status === 409) return '현재 상태에서는 처리할 수 없습니다.'
  return fallback
}

export function formatProgressRate(value: number): string {
  return `${value}%`
}
