import { AppError } from '../../shared/api/errors'
import type { BadgeProps } from '../../shared/ui'
import type { EvaluationCycleStatus } from './evaluationTypes'
import type { EvaluationProgressEmployee, EvaluationProgressStatus } from './hrEvaluationTypes'

export function progressStatusLabel(status: string): string {
  if (status === 'NOT_STARTED') return '시작 전'
  if (status === 'IN_PROGRESS') return '작성 중'
  if (status === 'SUBMITTED') return '제출 완료'
  return status
}

export function progressStatusBadgeVariant(status: EvaluationProgressStatus): NonNullable<BadgeProps['variant']> {
  if (status === 'SUBMITTED') return 'success'
  if (status === 'IN_PROGRESS') return 'info'
  return 'neutral'
}

export function isAssignmentWritable(status: EvaluationCycleStatus): boolean { return status === 'PLANNED' }

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

export function mapAssignmentErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AppError) {
    if (error.code === 'EVALUATION_DUPLICATE_ASSIGNMENT') return '이미 해당 평가 주기에 배정된 직원입니다.'
    if (error.code === 'EVALUATION_MANAGER_RELATION_INVALID') return '유효한 직속 관리자가 없어 평가를 배정할 수 없습니다.'
    if (error.code === 'EVALUATION_TEMPLATE_NOT_READY') return '자기/관리자 평가 템플릿과 평가 항목 설정을 확인해 주세요.'
    if (error.code === 'EVALUATION_CYCLE_NOT_ASSIGNABLE') return '현재 평가 주기에는 직원을 배정할 수 없습니다.'
    if (error.code === 'EVALUATION_TARGET_INVALID') return '유효한 직원을 선택해 주세요.'
  }
  return mapHrEvaluationErrorMessage(error, fallback)
}

export function isPublished(entry: EvaluationProgressEmployee): boolean {
  return entry.selfEvaluation?.evaluationStatus === 'PUBLISHED' && entry.managerEvaluation?.evaluationStatus === 'PUBLISHED'
}

export function getPublishEvaluationId(entry: EvaluationProgressEmployee): number | null {
  return entry.managerEvaluation?.evaluationId ?? entry.selfEvaluation?.evaluationId ?? null
}

export function isPublishCandidate(cycleStatus: EvaluationCycleStatus, entry: EvaluationProgressEmployee): boolean {
  return cycleStatus === 'CLOSED' && entry.selfEvaluation != null && entry.managerEvaluation != null && !isPublished(entry)
}

export function mapPublishErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AppError) {
    if (error.code === 'EVALUATION_NOT_PUBLISHABLE') return '현재 평가 결과를 발행할 수 없습니다.'
    if (error.code === 'EVALUATION_PUBLISH_CONFLICT') return '평가 발행 상태가 일치하지 않습니다. 진행 상태를 다시 확인해 주세요.'
    if (error.code === 'EVALUATION_FEEDBACK_INVALID') return '공개할 관리자 피드백 정보를 다시 확인해 주세요.'
  }
  return mapHrEvaluationErrorMessage(error, fallback)
}
