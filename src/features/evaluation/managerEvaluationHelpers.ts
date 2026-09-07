import { AppError } from '../../shared/api/errors'
import { parseEvaluationScore } from './evaluationHelpers'
import type { ManagerEvaluationDraftInput } from './managerEvaluationTypes'

export interface ManagerEvaluationFormItemInput {
  evaluationItemId: number
  scoreInput: string
  itemFeedback: string
}

export function buildManagerEvaluationDraftInput(
  items: ManagerEvaluationFormItemInput[],
  overallFeedback: string,
): ManagerEvaluationDraftInput {
  return {
    items: items.map((item) => ({
      evaluationItemId: item.evaluationItemId,
      score: parseEvaluationScore(item.scoreInput),
      itemFeedback: item.itemFeedback === '' ? null : item.itemFeedback,
    })),
    overallFeedback: overallFeedback === '' ? null : overallFeedback,
  }
}

export function mapManagerEvaluationErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!(error instanceof AppError)) return fallback
  if (error.status === 400) return '입력 내용을 확인해 주세요.'
  if (error.status === 403) return '평가 권한이 없습니다.'
  if (error.status === 404) return '요청한 평가를 찾을 수 없습니다.'
  if (
    error.status === 409 &&
    error.code === 'EVALUATION_MANAGER_RELATION_INVALID'
  ) return '조직 정보가 변경되어 이 평가에 접근할 수 없습니다.'
  if (error.status === 409) return '현재 평가 상태에서는 처리할 수 없습니다.'
  return fallback
}
