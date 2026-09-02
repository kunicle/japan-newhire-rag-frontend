import { describe, expect, it } from 'vitest'
import { AppError } from '../../shared/api/errors'
import { isCycleDatesEditable, isCycleEditable, isTemplateOrItemWritable, mapHrEvaluationErrorMessage } from './hrEvaluationHelpers'

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
})
