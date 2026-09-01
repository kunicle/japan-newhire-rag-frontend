import type { BadgeProps } from '../../shared/ui'
import { AppError } from '../../shared/api/errors'
import type { CoursePublicationStatus } from './hrCourseTypes'

export function coursePublicationLabel(status: CoursePublicationStatus | string): string {
  if (status === 'DRAFT') return '초안'
  if (status === 'PUBLIC') return '공개'
  if (status === 'PRIVATE') return '비공개'
  return status
}

export function coursePublicationBadgeVariant(
  status: CoursePublicationStatus,
): NonNullable<BadgeProps['variant']> {
  if (status === 'PUBLIC') return 'success'
  if (status === 'PRIVATE') return 'warning'
  return 'neutral'
}

export function getAllowedPublicationTargets(
  status: CoursePublicationStatus,
): CoursePublicationStatus[] {
  if (status === 'DRAFT') return ['PUBLIC']
  if (status === 'PUBLIC') return ['PRIVATE', 'DRAFT']
  return ['PUBLIC', 'DRAFT']
}

export function mapHrCourseErrorMessage(
  error: unknown,
  fallback: string,
  conflictMessage = '현재 상태에서는 처리할 수 없습니다.',
): string {
  if (!(error instanceof AppError)) return fallback
  if (error.status === 400) return '입력 내용을 확인해 주세요.'
  if (error.status === 403) return '교육 과정 관리 권한이 없습니다.'
  if (error.status === 404) return '요청한 교육 과정을 찾을 수 없습니다.'
  if (error.status === 409) return conflictMessage
  return fallback
}
