import { AppError } from '../../shared/api/errors'
import type { EvaluationCycleStatus } from './evaluationTypes'

export function isCycleEditable(status: EvaluationCycleStatus): boolean {
  return status !== 'CLOSED'
}

export function isCycleDatesEditable(status: EvaluationCycleStatus): boolean {
  return status === 'PLANNED'
}

export function isTemplateOrItemWritable(status: EvaluationCycleStatus): boolean {
  return status === 'PLANNED'
}

export function mapHrEvaluationErrorMessage(
  error: unknown,
  fallback: string,
  conflictMessage = '현재 상태에서는 처리할 수 없습니다.',
): string {
  if (!(error instanceof AppError)) return fallback
  if (error.status === 400) return '입력 내용을 확인해 주세요.'
  if (error.status === 403) return '평가 관리 권한이 없습니다.'
  if (error.status === 404) return '요청한 항목을 찾을 수 없습니다.'
  if (error.status === 409) return conflictMessage
  return fallback
}
