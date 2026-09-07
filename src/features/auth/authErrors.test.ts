import { describe, expect, it } from 'vitest'
import { AppError } from '../../shared/api/errors'
import { mapLoginErrorMessage } from './authErrors'

const INVALID_CREDENTIALS_MESSAGE =
  '이메일 또는 비밀번호가 올바르지 않습니다.'
const GENERAL_ERROR_MESSAGE =
  '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'

describe('mapLoginErrorMessage', () => {
  it('maps a 401 AppError to the credentials message', () => {
    expect(mapLoginErrorMessage(new AppError(401, 'UNAUTHORIZED', 'raw'))).toBe(
      INVALID_CREDENTIALS_MESSAGE,
    )
  })

  it.each([
    new AppError(403, 'FORBIDDEN', 'raw'),
    new AppError(500, 'INTERNAL_ERROR', 'raw'),
    new Error('raw'),
    new TypeError('raw'),
    'unknown',
  ])('maps non-credential errors to the general message', (error) => {
    expect(mapLoginErrorMessage(error)).toBe(GENERAL_ERROR_MESSAGE)
  })
})
