import { describe, expect, it } from 'vitest'
import { AppError } from '../../shared/api/errors'
import { mapDocumentErrorMessage } from './documentErrors'

const FALLBACK = '요청을 처리하지 못했습니다.'

describe('mapDocumentErrorMessage', () => {
  it('maps 403 to a fixed forbidden message', () => {
    expect(mapDocumentErrorMessage(new AppError(403, 'FORBIDDEN', 'raw'), FALLBACK))
      .toBe('이 작업을 수행할 권한이 없습니다.')
  })

  it.each([
    [400, 'TXT 파일만 업로드할 수 있습니다.'],
    [400, '파일 크기가 5MB를 초과했습니다.'],
    [400, '문서 카테고리가 없습니다.'],
    [400, '비활성 문서 카테고리는 사용할 수 없습니다.'],
    [409, '이미 공개된 버전입니다.'],
    [400, 'ALL 범위에는 접근 조건을 설정할 수 없습니다.'],
    [400, 'RESTRICTED 범위에는 conditionOperator가 필요합니다.'],
    [400, 'RESTRICTED 범위에는 접근 조건이 필요합니다.'],
    [404, '존재하지 않는 역할입니다.'],
    [404, '존재하지 않는 직급입니다.'],
  ])('passes through an exact safe message: %s %s', (status, message) => {
    expect(mapDocumentErrorMessage(new AppError(status, 'INVALID', message), FALLBACK))
      .toBe(message)
  })

  it('does not expose an arbitrary 400 message', () => {
    expect(mapDocumentErrorMessage(
      new AppError(400, 'INVALID', 'database details'),
      FALLBACK,
    )).toBe('입력한 문서 정보를 확인해 주세요.')
  })

  it('does not expose an arbitrary 409 message', () => {
    expect(mapDocumentErrorMessage(
      new AppError(409, 'CONFLICT', 'internal state details'),
      FALLBACK,
    )).toBe('현재 상태에서는 요청을 처리할 수 없습니다.')
  })

  it('does not expose an arbitrary 404 message', () => {
    expect(mapDocumentErrorMessage(
      new AppError(404, 'NOT_FOUND', 'internal lookup details'),
      FALLBACK,
    )).toBe('요청한 정보를 찾을 수 없습니다.')
  })

  it('requires an exact safe 404 match', () => {
    expect(mapDocumentErrorMessage(
      new AppError(404, 'NOT_FOUND', '존재하지 않는 역할입니다. internal detail'),
      FALLBACK,
    )).toBe('요청한 정보를 찾을 수 없습니다.')
  })

  it.each([
    new AppError(500, 'INTERNAL_ERROR', 'raw backend details'),
    new Error('raw error'),
    'unknown',
  ])('uses the caller fallback for unknown errors', (error) => {
    expect(mapDocumentErrorMessage(error, FALLBACK)).toBe(FALLBACK)
  })
})
