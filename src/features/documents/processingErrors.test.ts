import { describe, expect, it } from 'vitest'
import { AppError } from '../../shared/api/errors'
import { mapProcessingErrorMessage } from './processingErrors'

const FALLBACK = '재시도 요청을 처리하지 못했습니다.'

describe('mapProcessingErrorMessage', () => {
  it('maps 403 to a fixed forbidden message', () => {
    expect(
      mapProcessingErrorMessage(
        new AppError(403, 'FORBIDDEN', 'internal authorization details'),
        FALLBACK,
      ),
    ).toBe('이 작업을 수행할 권한이 없습니다.')
  })

  it('passes through the exact safe 404 message', () => {
    const message = '처리 작업을 찾을 수 없습니다.'

    expect(
      mapProcessingErrorMessage(
        new AppError(404, 'RESOURCE_NOT_FOUND', message),
        FALLBACK,
      ),
    ).toBe(message)
  })

  it.each([
    '최신 처리 작업만 재시도할 수 있습니다.',
    '실패한 작업만 재시도할 수 있습니다.',
    '재처리할 청크가 없습니다.',
  ])('passes through an exact safe 409 message: %s', (message) => {
    expect(
      mapProcessingErrorMessage(
        new AppError(409, 'CONFLICT', message),
        FALLBACK,
      ),
    ).toBe(message)
  })

  it('does not expose an arbitrary 404 message', () => {
    expect(
      mapProcessingErrorMessage(
        new AppError(
          404,
          'RESOURCE_NOT_FOUND',
          'internal document processing details',
        ),
        FALLBACK,
      ),
    ).toBe('처리 작업을 찾을 수 없습니다.')
  })

  it('does not expose an arbitrary 409 message', () => {
    expect(
      mapProcessingErrorMessage(
        new AppError(409, 'CONFLICT', 'internal retry state details'),
        FALLBACK,
      ),
    ).toBe('현재 상태에서는 재시도할 수 없습니다.')
  })

  it('uses the caller fallback for a 500 AppError', () => {
    expect(
      mapProcessingErrorMessage(
        new AppError(500, 'INTERNAL_ERROR', 'some internal provider failure'),
        FALLBACK,
      ),
    ).toBe(FALLBACK)
  })

  it('uses the caller fallback for a non-AppError', () => {
    expect(
      mapProcessingErrorMessage(new Error('network details'), FALLBACK),
    ).toBe(FALLBACK)
  })

  it('requires an exact allow-list match', () => {
    expect(
      mapProcessingErrorMessage(
        new AppError(
          409,
          'CONFLICT',
          '최신 처리 작업만 재시도할 수 있습니다. internal detail',
        ),
        FALLBACK,
      ),
    ).toBe('현재 상태에서는 재시도할 수 없습니다.')
  })
})
