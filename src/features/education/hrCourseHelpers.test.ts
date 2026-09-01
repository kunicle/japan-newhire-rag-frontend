import { describe, expect, it } from 'vitest'
import { AppError } from '../../shared/api/errors'
import {
  coursePublicationBadgeVariant,
  coursePublicationLabel,
  getAllowedPublicationTargets,
  mapHrCourseErrorMessage,
} from './hrCourseHelpers'

describe('hrCourseHelpers', () => {
  it.each([
    ['DRAFT', '초안'], ['PUBLIC', '공개'], ['PRIVATE', '비공개'], ['UNKNOWN', 'UNKNOWN'],
  ])('maps publication label %s', (status, expected) => {
    expect(coursePublicationLabel(status)).toBe(expected)
  })

  it('maps publication badge variants', () => {
    expect(coursePublicationBadgeVariant('DRAFT')).toBe('neutral')
    expect(coursePublicationBadgeVariant('PUBLIC')).toBe('success')
    expect(coursePublicationBadgeVariant('PRIVATE')).toBe('warning')
  })

  it('returns exact allowed publication targets', () => {
    expect(getAllowedPublicationTargets('DRAFT')).toEqual(['PUBLIC'])
    expect(getAllowedPublicationTargets('PUBLIC')).toEqual(['PRIVATE', 'DRAFT'])
    expect(getAllowedPublicationTargets('PRIVATE')).toEqual(['PUBLIC', 'DRAFT'])
  })

  it.each([
    [400, '입력 내용을 확인해 주세요.'],
    [403, '교육 과정 관리 권한이 없습니다.'],
    [404, '요청한 교육 과정을 찾을 수 없습니다.'],
    [409, '현재 상태에서는 처리할 수 없습니다.'],
  ])('maps safe status %s errors', (status, expected) => {
    expect(mapHrCourseErrorMessage(new AppError(status, 'ERROR', 'raw'), 'fallback'))
      .toBe(expected)
  })

  it('uses a custom conflict message', () => {
    expect(mapHrCourseErrorMessage(
      new AppError(409, 'CONFLICT', 'raw'), 'fallback', 'custom conflict',
    )).toBe('custom conflict')
  })

  it('uses fallback for 500 and non-AppError failures', () => {
    expect(mapHrCourseErrorMessage(new AppError(500, 'ERROR', 'raw'), 'fallback'))
      .toBe('fallback')
    expect(mapHrCourseErrorMessage(new Error('raw'), 'fallback')).toBe('fallback')
  })
})
