import { AppError } from '../../shared/api/errors'

const FORBIDDEN_MESSAGE = '이 작업을 수행할 권한이 없습니다.'
const INVALID_INPUT_MESSAGE = '입력한 문서 정보를 확인해 주세요.'
const CONFLICT_MESSAGE = '현재 상태에서는 요청을 처리할 수 없습니다.'
const NOT_FOUND_MESSAGE = '요청한 정보를 찾을 수 없습니다.'

const SAFE_MESSAGES = new Set([
  'TXT 파일만 업로드할 수 있습니다.',
  '파일 크기가 5MB를 초과했습니다.',
  '문서 카테고리가 없습니다.',
  '비활성 문서 카테고리는 사용할 수 없습니다.',
  '이미 공개된 버전입니다.',
  'ALL 범위에는 접근 조건을 설정할 수 없습니다.',
  'RESTRICTED 범위에는 conditionOperator가 필요합니다.',
  'RESTRICTED 범위에는 접근 조건이 필요합니다.',
  '존재하지 않는 역할입니다.',
  '존재하지 않는 직급입니다.',
])

export function mapDocumentErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!(error instanceof AppError)) return fallback
  if (error.status === 403) return FORBIDDEN_MESSAGE

  if (
    (error.status === 400 || error.status === 404 || error.status === 409) &&
    SAFE_MESSAGES.has(error.message)
  ) {
    return error.message
  }

  if (error.status === 400) return INVALID_INPUT_MESSAGE
  if (error.status === 404) return NOT_FOUND_MESSAGE
  if (error.status === 409) return CONFLICT_MESSAGE
  return fallback
}
