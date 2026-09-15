import { describe, expect, it } from 'vitest'
import { AppError } from '../../shared/api/errors'
import {
  buildSelfEvaluationDraftInput,
  EVALUATION_ITEM_FEEDBACK_PLACEHOLDER,
  EVALUATION_SCORE_DECIMAL_GUIDE,
  EVALUATION_SCORE_GUIDE,
  evaluationCycleStatusBadgeVariant,
  evaluationCycleStatusLabel,
  evaluationStatusBadgeVariant,
  evaluationStatusLabel,
  isEvaluationWritable,
  mapEvaluationErrorMessage,
  parseEvaluationScore,
  validateEvaluationScoreInput,
} from './evaluationHelpers'

describe('evaluation labels and badges', () => {
  it.each([
    ['DRAFT', '작성 중'], ['SUBMITTED', '제출 완료'],
    ['RETURNED', '반려됨'], ['PUBLISHED', '발행 완료'], ['UNKNOWN', 'UNKNOWN'],
  ])('maps evaluation status %s', (status, label) => {
    expect(evaluationStatusLabel(status)).toBe(label)
  })

  it.each([
    ['DRAFT', 'neutral'], ['SUBMITTED', 'info'],
    ['RETURNED', 'warning'], ['PUBLISHED', 'success'],
  ] as const)('maps evaluation badge %s', (status, variant) => {
    expect(evaluationStatusBadgeVariant(status)).toBe(variant)
  })

  it.each([
    ['PLANNED', '예정'], ['OPEN', '진행 중'], ['CLOSED', '마감'],
    ['PUBLISHED', '발행 완료'], ['UNKNOWN', 'UNKNOWN'],
  ])('maps cycle status %s', (status, label) => {
    expect(evaluationCycleStatusLabel(status)).toBe(label)
  })

  it.each([
    ['PLANNED', 'neutral'], ['OPEN', 'info'],
    ['CLOSED', 'warning'], ['PUBLISHED', 'success'],
  ] as const)('maps cycle badge %s', (status, variant) => {
    expect(evaluationCycleStatusBadgeVariant(status)).toBe(variant)
  })
})

describe('isEvaluationWritable', () => {
  it('allows only an open draft', () => {
    expect(isEvaluationWritable('DRAFT', 'OPEN')).toBe(true)
    expect(isEvaluationWritable('DRAFT', 'PLANNED')).toBe(false)
    expect(isEvaluationWritable('SUBMITTED', 'OPEN')).toBe(false)
    expect(isEvaluationWritable('RETURNED', 'OPEN')).toBe(false)
  })
})

describe('score helpers', () => {
  it('provides the shared score guide without changing decimal-score support', () => {
    expect(EVALUATION_SCORE_GUIDE).toEqual([
      { score: 1, label: '매우 부족' },
      { score: 2, label: '부족' },
      { score: 3, label: '보통' },
      { score: 4, label: '우수' },
      { score: 5, label: '매우 우수' },
    ])
    expect(EVALUATION_SCORE_DECIMAL_GUIDE).toBe(
      '1~5점 사이에서 0.1점 단위로 입력할 수 있습니다.',
    )
    expect(EVALUATION_ITEM_FEEDBACK_PLACEHOLDER).toBe(
      '이 점수를 선택한 이유나 구체적인 사례를 입력하세요.',
    )
    expect(validateEvaluationScoreInput('4.5')).toBeNull()
  })

  it.each(['', '   '])('parses blank %j as null', (value) => {
    expect(parseEvaluationScore(value)).toBeNull()
    expect(validateEvaluationScoreInput(value)).toBeNull()
  })

  it.each(['1', '1.0', '1.1', '4.9', '5'])('accepts %s', (value) => {
    expect(validateEvaluationScoreInput(value)).toBeNull()
  })

  it.each(['0', '5.1', '1.11', 'abc'])('rejects %s', (value) => {
    expect(validateEvaluationScoreInput(value)).toBe('invalid')
  })

  it('builds a draft in original order and preserves IDs', () => {
    expect(buildSelfEvaluationDraftInput([
      { evaluationItemId: 20, scoreInput: '', itemFeedback: '' },
      { evaluationItemId: 10, scoreInput: '4.5', itemFeedback: ' feedback ' },
    ], '')).toEqual({
      items: [
        { evaluationItemId: 20, score: null, itemFeedback: null },
        { evaluationItemId: 10, score: 4.5, itemFeedback: ' feedback ' },
      ],
      overallFeedback: null,
    })
  })
})

describe('mapEvaluationErrorMessage', () => {
  it.each([
    [400, '입력 내용을 확인해 주세요.'],
    [403, '본인의 평가만 확인하거나 처리할 수 있습니다.'],
    [404, '요청한 평가를 찾을 수 없습니다.'],
    [409, '현재 평가 상태에서는 처리할 수 없습니다.'],
    [500, 'fallback'],
  ])('maps HTTP %i safely', (status, expected) => {
    expect(mapEvaluationErrorMessage(
      new AppError(status, 'ERROR', 'raw'), 'fallback',
    )).toBe(expected)
  })

  it('supports a custom conflict message and non-AppError fallback', () => {
    expect(mapEvaluationErrorMessage(
      new AppError(409, 'CONFLICT', 'raw'), 'fallback', 'custom',
    )).toBe('custom')
    expect(mapEvaluationErrorMessage(new Error('raw'), 'fallback')).toBe('fallback')
  })
})
