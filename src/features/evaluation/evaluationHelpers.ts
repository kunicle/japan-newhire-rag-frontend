import { AppError } from '../../shared/api/errors'
import type { BadgeProps } from '../../shared/ui'
import type {
  EvaluationCycleStatus,
  EvaluationStatus,
  SelfEvaluationDraftInput,
} from './evaluationTypes'

export interface EvaluationFormItemInput {
  evaluationItemId: number
  scoreInput: string
  itemFeedback: string
}

export function evaluationStatusLabel(status: string): string {
  if (status === 'DRAFT') return '작성 중'
  if (status === 'SUBMITTED') return '제출 완료'
  if (status === 'RETURNED') return '반려됨'
  if (status === 'PUBLISHED') return '발행 완료'
  return status
}

export function evaluationStatusBadgeVariant(
  status: EvaluationStatus,
): NonNullable<BadgeProps['variant']> {
  if (status === 'PUBLISHED') return 'success'
  if (status === 'SUBMITTED') return 'info'
  if (status === 'RETURNED') return 'warning'
  return 'neutral'
}

export function evaluationCycleStatusLabel(status: string): string {
  if (status === 'PLANNED') return '예정'
  if (status === 'OPEN') return '진행 중'
  if (status === 'CLOSED') return '마감'
  if (status === 'PUBLISHED') return '발행 완료'
  return status
}

export function evaluationCycleStatusBadgeVariant(
  status: EvaluationCycleStatus,
): NonNullable<BadgeProps['variant']> {
  if (status === 'PUBLISHED') return 'success'
  if (status === 'OPEN') return 'info'
  if (status === 'CLOSED') return 'warning'
  return 'neutral'
}

export function isEvaluationWritable(
  evaluationStatus: EvaluationStatus,
  currentCycleStatus: EvaluationCycleStatus,
): boolean {
  return evaluationStatus === 'DRAFT' && currentCycleStatus === 'OPEN'
}

export function mapEvaluationErrorMessage(
  error: unknown,
  fallback: string,
  conflictMessage = '현재 평가 상태에서는 처리할 수 없습니다.',
): string {
  if (!(error instanceof AppError)) return fallback
  if (error.status === 400) return '입력 내용을 확인해 주세요.'
  if (error.status === 403) return '본인의 평가만 확인하거나 처리할 수 있습니다.'
  if (error.status === 404) return '요청한 평가를 찾을 수 없습니다.'
  if (error.status === 409) return conflictMessage
  return fallback
}

export function parseEvaluationScore(value: string): number | null {
  return value.trim() === '' ? null : Number(value)
}

export function validateEvaluationScoreInput(value: string): string | null {
  const normalized = value.trim()
  if (normalized === '') return null
  if (!/^[+-]?\d+(?:\.\d)?$/.test(normalized)) return 'invalid'
  const score = Number(normalized)
  return Number.isFinite(score) && score >= 1 && score <= 5 ? null : 'invalid'
}

export function buildSelfEvaluationDraftInput(
  items: EvaluationFormItemInput[],
  overallFeedback: string,
): SelfEvaluationDraftInput {
  return {
    items: items.map((item) => ({
      evaluationItemId: item.evaluationItemId,
      score: parseEvaluationScore(item.scoreInput),
      itemFeedback: item.itemFeedback === '' ? null : item.itemFeedback,
    })),
    overallFeedback: overallFeedback === '' ? null : overallFeedback,
  }
}
