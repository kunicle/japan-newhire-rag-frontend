import { AppError } from '../../shared/api/errors'

const INVALID_CREDENTIALS_MESSAGE =
  '이메일 또는 비밀번호가 올바르지 않습니다.'
const GENERAL_ERROR_MESSAGE =
  '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'

export function mapLoginErrorMessage(error: unknown): string {
  if (error instanceof AppError && error.status === 401) {
    return INVALID_CREDENTIALS_MESSAGE
  }

  return GENERAL_ERROR_MESSAGE
}
