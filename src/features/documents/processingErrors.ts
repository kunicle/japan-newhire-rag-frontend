import { AppError } from '../../shared/api/errors'

const FORBIDDEN_MESSAGE = '이 작업을 수행할 권한이 없습니다.'
const NOT_FOUND_MESSAGE = '처리 작업을 찾을 수 없습니다.'
const CONFLICT_MESSAGE = '현재 상태에서는 재시도할 수 없습니다.'

const SAFE_MESSAGES = new Set([
  '처리 작업을 찾을 수 없습니다.',
  '최신 처리 작업만 재시도할 수 있습니다.',
  '실패한 작업만 재시도할 수 있습니다.',
  '재처리할 청크가 없습니다.',
])

export function mapProcessingErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!(error instanceof AppError)) return fallback
  if (error.status === 403) return FORBIDDEN_MESSAGE

  if ((error.status === 404 || error.status === 409) && SAFE_MESSAGES.has(error.message)) {
    return error.message
  }

  if (error.status === 404) return NOT_FOUND_MESSAGE
  if (error.status === 409) return CONFLICT_MESSAGE
  return fallback
}
