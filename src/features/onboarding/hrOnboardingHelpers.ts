import { AppError } from '../../shared/api/errors'

const DEFAULT_CONFLICT_MESSAGE = '현재 상태에서는 처리할 수 없습니다.'

export function mapHrOnboardingErrorMessage(
  error: unknown,
  fallback: string,
  conflictMessage: string = DEFAULT_CONFLICT_MESSAGE,
): string {
  if (!(error instanceof AppError)) return fallback
  if (error.status === 400) return '입력 내용을 확인해 주세요.'
  if (error.status === 403) return '온보딩 관리 권한이 없습니다.'
  if (error.status === 404) return '요청한 온보딩 정보를 찾을 수 없습니다.'
  if (error.status === 409) return conflictMessage
  return fallback
}
