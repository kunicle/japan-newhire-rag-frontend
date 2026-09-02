import { request } from '../../shared/api/httpClient'
import type {
  EvaluationResult,
  MyEvaluationSummary,
  SelfEvaluationDetail,
  SelfEvaluationDraftInput,
} from './evaluationTypes'

export function fetchMyEvaluations(): Promise<MyEvaluationSummary[]> {
  return request<MyEvaluationSummary[]>('/me/evaluations')
}

export function fetchSelfEvaluation(
  evaluationId: number,
): Promise<SelfEvaluationDetail> {
  return request<SelfEvaluationDetail>(`/me/evaluations/${evaluationId}/self`)
}

export function saveSelfEvaluationDraft(
  evaluationId: number,
  input: SelfEvaluationDraftInput,
): Promise<SelfEvaluationDetail> {
  return request<SelfEvaluationDetail>(`/me/evaluations/${evaluationId}/self/draft`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function submitSelfEvaluation(evaluationId: number): Promise<void> {
  return request<void>(`/me/evaluations/${evaluationId}/self/submission`, {
    method: 'POST',
  })
}

export function fetchMyEvaluationResult(cycleId: number): Promise<EvaluationResult> {
  return request<EvaluationResult>(`/me/evaluations/result?cycleId=${cycleId}`)
}
