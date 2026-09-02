import { describe, expect, it } from 'vitest'
import { AppError } from '../../shared/api/errors'
import { isAssignmentWritable, isCycleDatesEditable, isCycleEditable, isTemplateOrItemWritable, mapAssignmentErrorMessage, mapHrEvaluationErrorMessage, progressStatusBadgeVariant, progressStatusLabel } from './hrEvaluationHelpers'

describe('HR evaluation helpers', () => {
  it.each([['PLANNED', true], ['OPEN', true], ['CLOSED', false]] as const)('maps cycle editability for %s', (status, expected) => expect(isCycleEditable(status)).toBe(expected))
  it.each([['PLANNED', true], ['OPEN', false], ['CLOSED', false]] as const)('maps date editability for %s', (status, expected) => expect(isCycleDatesEditable(status)).toBe(expected))
  it.each([['PLANNED', true], ['OPEN', false], ['CLOSED', false]] as const)('maps setup writability for %s', (status, expected) => expect(isTemplateOrItemWritable(status)).toBe(expected))
  it.each([
    [400, 'BAD', '입력 내용을 확인해 주세요.'], [403, 'DENIED', '평가 관리 권한이 없습니다.'],
    [404, 'MISSING', '요청한 항목을 찾을 수 없습니다.'], [409, 'CONFLICT', 'custom'],
    [500, 'ERROR', 'fallback'],
  ])('maps status %i safely', (status, code, expected) => expect(mapHrEvaluationErrorMessage(new AppError(status, code, 'raw'), 'fallback', 'custom')).toBe(expected))
  it('uses the default conflict message', () => expect(mapHrEvaluationErrorMessage(new AppError(409, 'CONFLICT', 'raw'), 'fallback')).toBe('현재 상태에서는 처리할 수 없습니다.'))
  it('uses fallback for non-AppError', () => expect(mapHrEvaluationErrorMessage(new Error('raw'), 'fallback')).toBe('fallback'))
  it.each([['NOT_STARTED', '시작 전'], ['IN_PROGRESS', '작성 중'], ['SUBMITTED', '제출 완료']] as const)('labels progress %s', (status, expected) => expect(progressStatusLabel(status)).toBe(expected))
  it.each([['NOT_STARTED', 'neutral'], ['IN_PROGRESS', 'info'], ['SUBMITTED', 'success']] as const)('maps progress badge %s', (status, expected) => expect(progressStatusBadgeVariant(status)).toBe(expected))
  it.each([['PLANNED', true], ['OPEN', false], ['CLOSED', false]] as const)('maps assignment writability for %s', (status, expected) => expect(isAssignmentWritable(status)).toBe(expected))
  it.each([
    ['EVALUATION_DUPLICATE_ASSIGNMENT', '이미 해당 평가 주기에 배정된 직원입니다.'],
    ['EVALUATION_MANAGER_RELATION_INVALID', '유효한 직속 관리자가 없어 평가를 배정할 수 없습니다.'],
    ['EVALUATION_TEMPLATE_NOT_READY', '자기/관리자 평가 템플릿과 평가 항목 설정을 확인해 주세요.'],
    ['EVALUATION_CYCLE_NOT_ASSIGNABLE', '현재 평가 주기에는 직원을 배정할 수 없습니다.'],
    ['EVALUATION_TARGET_INVALID', '유효한 직원을 선택해 주세요.'],
  ])('maps assignment error %s', (code, expected) => expect(mapAssignmentErrorMessage(new AppError(409, code, 'raw'), 'fallback')).toBe(expected))
  it('delegates generic assignment conflicts', () => expect(mapAssignmentErrorMessage(new AppError(409, 'OTHER', 'raw'), 'fallback')).toBe('현재 상태에서는 처리할 수 없습니다.'))
  it('uses assignment fallback for non-AppError', () => expect(mapAssignmentErrorMessage(new Error('raw'), 'fallback')).toBe('fallback'))
})
