import { describe, expect, it } from 'vitest'
import { AppError } from '../../shared/api/errors'
import {
  mapOnboardingErrorMessage,
  onboardingStatusBadgeVariant,
  onboardingStatusLabel,
} from './onboardingHelpers'

describe('onboardingStatusLabel', () => {
  it.each([
    ['NOT_STARTED', '시작 전'],
    ['IN_PROGRESS', '진행 중'],
    ['COMPLETED', '완료'],
    ['UNKNOWN', 'UNKNOWN'],
  ])('maps %s to %s', (status, expected) => {
    expect(onboardingStatusLabel(status)).toBe(expected)
  })
})

describe('onboardingStatusBadgeVariant', () => {
  it.each([
    ['NOT_STARTED', 'neutral'],
    ['IN_PROGRESS', 'info'],
    ['COMPLETED', 'success'],
  ] as const)('maps %s to %s', (status, expected) => {
    expect(onboardingStatusBadgeVariant(status)).toBe(expected)
  })
})

describe('mapOnboardingErrorMessage', () => {
  const fallback = 'fallback'

  it.each([
    [400, '요청 정보를 확인해 주세요.'],
    [403, '본인의 온보딩 정보만 처리할 수 있습니다.'],
    [404, '요청한 온보딩 정보를 찾을 수 없습니다.'],
    [409, '현재 상태에서는 처리할 수 없습니다.'],
    [500, fallback],
  ])('maps HTTP %i safely', (status, expected) => {
    expect(mapOnboardingErrorMessage(
      new AppError(status, 'ERROR', 'raw backend message'),
      fallback,
    )).toBe(expected)
  })

  it('uses a custom conflict message', () => {
    expect(mapOnboardingErrorMessage(
      new AppError(409, 'CONFLICT', 'raw'),
      fallback,
      'custom conflict',
    )).toBe('custom conflict')
  })

  it('uses the fallback for a non-AppError', () => {
    expect(mapOnboardingErrorMessage(new Error('raw'), fallback)).toBe(fallback)
  })
})
