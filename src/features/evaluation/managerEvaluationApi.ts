import { request } from '../../shared/api/httpClient'
import type {
  ManagerEvaluationDetail,
  ManagerEvaluationDraftInput,
  ManagerEvaluationProgress,
  ManagerEvaluationSummary,
} from './managerEvaluationTypes'

export function fetchManagerEvaluations(): Promise<ManagerEvaluationSummary[]> {
  return request<ManagerEvaluationSummary[]>('/manager/evaluations')
}

export function fetchManagerEvaluation(
  evaluationId: number,
): Promise<ManagerEvaluationDetail> {
  return request<ManagerEvaluationDetail>(`/manager/evaluations/${evaluationId}`)
}

export function saveManagerEvaluationDraft(
  evaluationId: number,
  input: ManagerEvaluationDraftInput,
): Promise<ManagerEvaluationDetail> {
  return request<ManagerEvaluationDetail>(`/manager/evaluations/${evaluationId}/draft`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function submitManagerEvaluation(evaluationId: number): Promise<void> {
  return request<void>(`/manager/evaluations/${evaluationId}/submission`, {
    method: 'POST',
  })
}

export function fetchManagerEvaluationProgress(
  cycleId: number,
): Promise<ManagerEvaluationProgress> {
  return request<ManagerEvaluationProgress>(
    `/manager/evaluations/progress?cycleId=${cycleId}`,
  )
}
