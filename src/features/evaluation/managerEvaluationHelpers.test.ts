import { describe, expect, it } from 'vitest'
import { AppError } from '../../shared/api/errors'
import {
  buildManagerEvaluationDraftInput,
  mapManagerEvaluationErrorMessage,
} from './managerEvaluationHelpers'

describe('mapManagerEvaluationErrorMessage', () => {
  it.each([
    [400, 'INVALID', '입력 내용을 확인해 주세요.'],
    [403, 'FORBIDDEN', '평가 권한이 없습니다.'],
    [404, 'NOT_FOUND', '요청한 평가를 찾을 수 없습니다.'],
    [409, 'EVALUATION_MANAGER_RELATION_INVALID',
      '조직 정보가 변경되어 이 평가에 접근할 수 없습니다.'],
    [409, 'CONFLICT', '현재 평가 상태에서는 처리할 수 없습니다.'],
    [500, 'ERROR', 'fallback'],
  ])('maps HTTP %i and %s safely', (status, code, expected) => {
    expect(mapManagerEvaluationErrorMessage(
      new AppError(status, code, 'raw backend message'),
      'fallback',
    )).toBe(expected)
  })

  it('uses the fallback for a non-AppError', () => {
    expect(mapManagerEvaluationErrorMessage(new Error('raw'), 'fallback')).toBe('fallback')
  })
})

describe('buildManagerEvaluationDraftInput', () => {
  it('preserves order and meaningful whitespace while mapping blanks to null', () => {
    expect(buildManagerEvaluationDraftInput([
      { evaluationItemId: 20, scoreInput: ' ', itemFeedback: '' },
      { evaluationItemId: 10, scoreInput: '4.5', itemFeedback: ' feedback ' },
    ], ' overall ')).toEqual({
      items: [
        { evaluationItemId: 20, score: null, itemFeedback: null },
        { evaluationItemId: 10, score: 4.5, itemFeedback: ' feedback ' },
      ],
      overallFeedback: ' overall ',
    })
  })

  it('maps a blank overall feedback to null', () => {
    expect(buildManagerEvaluationDraftInput([], '').overallFeedback).toBeNull()
  })
})
