import { describe, expect, it } from 'vitest'
import { AppError } from '../../shared/api/errors'
import {
  enrollmentStatusBadgeVariant,
  enrollmentStatusLabel,
  mapEducationErrorMessage,
  mapManagerEducationErrorMessage,
  moduleStatusBadgeVariant,
  moduleStatusLabel,
} from './educationHelpers'

describe('educationHelpers', () => {
  it.each([
    ['NOT_STARTED', '시작 전'],
    ['IN_PROGRESS', '진행 중'],
    ['COMPLETED', '완료'],
    ['OVERDUE', '기한 초과'],
    ['UNKNOWN', 'UNKNOWN'],
  ])('maps enrollment status %s', (status, expected) => {
    expect(enrollmentStatusLabel(status)).toBe(expected)
  })

  it.each([
    ['NOT_STARTED', '시작 전'],
    ['IN_PROGRESS', '진행 중'],
    ['COMPLETED', '완료'],
    ['UNKNOWN', 'UNKNOWN'],
  ])('maps module status %s', (status, expected) => {
    expect(moduleStatusLabel(status)).toBe(expected)
  })

  it('maps enrollment badge variants', () => {
    expect(enrollmentStatusBadgeVariant('NOT_STARTED')).toBe('neutral')
    expect(enrollmentStatusBadgeVariant('IN_PROGRESS')).toBe('info')
    expect(enrollmentStatusBadgeVariant('COMPLETED')).toBe('success')
    expect(enrollmentStatusBadgeVariant('OVERDUE')).toBe('danger')
  })

  it('maps module badge variants', () => {
    expect(moduleStatusBadgeVariant('NOT_STARTED')).toBe('neutral')
    expect(moduleStatusBadgeVariant('IN_PROGRESS')).toBe('info')
    expect(moduleStatusBadgeVariant('COMPLETED')).toBe('success')
  })

  it.each([
    [400, '요청 정보를 확인해 주세요.'],
    [403, '본인의 교육 과정만 확인할 수 있습니다.'],
    [404, '요청한 교육 정보를 찾을 수 없습니다.'],
    [409, '현재 상태에서는 처리할 수 없습니다.'],
  ])('maps safe status %s errors', (status, expected) => {
    expect(mapEducationErrorMessage(
      new AppError(status, 'ERROR', 'raw backend message'),
      'fallback',
    )).toBe(expected)
  })

  it('uses fallback for a 500 AppError', () => {
    expect(mapEducationErrorMessage(
      new AppError(500, 'ERROR', 'raw backend message'),
      'fallback',
    )).toBe('fallback')
  })

  it('uses fallback for a non-AppError', () => {
    expect(mapEducationErrorMessage(new Error('raw'), 'fallback')).toBe('fallback')
  })

  it('maps manager 403 without exposing the backend message', () => {
    expect(mapManagerEducationErrorMessage(
      new AppError(403, 'FORBIDDEN', 'raw backend message'),
      'fallback',
    )).toBe('관리 권한이 없거나 해당 직원의 교육 정보를 조회할 수 없습니다.')
  })

  it.each([
    [400, '요청 정보를 확인해 주세요.'],
    [404, '요청한 교육 정보를 찾을 수 없습니다.'],
    [409, '현재 상태에서는 처리할 수 없습니다.'],
  ])('delegates manager status %s to the education mapper', (status, expected) => {
    expect(mapManagerEducationErrorMessage(
      new AppError(status, 'ERROR', 'raw backend message'),
      'fallback',
    )).toBe(expected)
  })

  it('uses fallback for a manager 500 AppError', () => {
    expect(mapManagerEducationErrorMessage(
      new AppError(500, 'ERROR', 'raw backend message'),
      'fallback',
    )).toBe('fallback')
  })

  it('uses fallback for a manager non-AppError', () => {
    expect(mapManagerEducationErrorMessage(new Error('raw'), 'fallback'))
      .toBe('fallback')
  })
})
