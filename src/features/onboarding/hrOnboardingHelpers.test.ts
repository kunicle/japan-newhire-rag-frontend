import { describe, expect, it } from 'vitest'
import { AppError } from '../../shared/api/errors'
import { mapHrOnboardingErrorMessage } from './hrOnboardingHelpers'

describe('mapHrOnboardingErrorMessage', () => {
  const fallback = 'fallback'

  it.each([
    [400, '입력 내용을 확인해 주세요.'],
    [403, '온보딩 관리 권한이 없습니다.'],
    [404, '요청한 온보딩 정보를 찾을 수 없습니다.'],
    [409, '현재 상태에서는 처리할 수 없습니다.'],
    [500, fallback],
  ])('maps HTTP %i safely', (status, expected) => {
    expect(mapHrOnboardingErrorMessage(
      new AppError(status, 'ERROR', 'raw backend message'),
      fallback,
    )).toBe(expected)
  })

  it('uses a custom conflict message', () => {
    expect(mapHrOnboardingErrorMessage(
      new AppError(409, 'CONFLICT', 'raw'),
      fallback,
      'custom conflict',
    )).toBe('custom conflict')
  })

  it('uses the fallback for a non-AppError', () => {
    expect(mapHrOnboardingErrorMessage(new Error('raw'), fallback)).toBe(fallback)
  })
})
