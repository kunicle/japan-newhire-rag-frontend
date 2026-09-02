import { request } from '../../shared/api/httpClient'
import type {
  EvaluationCycle,
  EvaluationAssignmentInput,
  EvaluationAssignmentResult,
  EvaluationProgress,
  EvaluationCycleInput,
  EvaluationItem,
  EvaluationItemCreateInput,
  EvaluationItemUpdateInput,
  EvaluationTemplate,
  EvaluationTemplateCreateInput,
  EvaluationTemplateUpdateInput,
} from './hrEvaluationTypes'

export function fetchEvaluationCycles(): Promise<EvaluationCycle[]> {
  return request<EvaluationCycle[]>('/hr/evaluation-cycles')
}

export function assignEvaluation(input: EvaluationAssignmentInput): Promise<EvaluationAssignmentResult> {
  return request<EvaluationAssignmentResult>('/hr/evaluation-assignments', { method: 'POST', body: JSON.stringify(input) })
}

export function fetchEvaluationProgress(cycleId: number): Promise<EvaluationProgress> {
  return request<EvaluationProgress>(`/hr/evaluations/progress?cycleId=${cycleId}`)
}

export function createEvaluationCycle(input: EvaluationCycleInput): Promise<EvaluationCycle> {
  return request<EvaluationCycle>('/hr/evaluation-cycles', {
    method: 'POST', body: JSON.stringify(input),
  })
}

export function fetchEvaluationCycle(cycleId: number): Promise<EvaluationCycle> {
  return request<EvaluationCycle>(`/hr/evaluation-cycles/${cycleId}`)
}

export function updateEvaluationCycle(
  cycleId: number, input: EvaluationCycleInput,
): Promise<EvaluationCycle> {
  return request<EvaluationCycle>(`/hr/evaluation-cycles/${cycleId}`, {
    method: 'PATCH', body: JSON.stringify(input),
  })
}

export function fetchEvaluationTemplates(cycleId: number): Promise<EvaluationTemplate[]> {
  return request<EvaluationTemplate[]>(`/hr/evaluation-cycles/${cycleId}/templates`)
}

export function createEvaluationTemplate(
  input: EvaluationTemplateCreateInput,
): Promise<EvaluationTemplate> {
  return request<EvaluationTemplate>('/hr/evaluation-templates', {
    method: 'POST', body: JSON.stringify(input),
  })
}

export function updateEvaluationTemplate(
  templateId: number, input: EvaluationTemplateUpdateInput,
): Promise<EvaluationTemplate> {
  return request<EvaluationTemplate>(`/hr/evaluation-templates/${templateId}`, {
    method: 'PATCH', body: JSON.stringify(input),
  })
}

export function fetchEvaluationItems(templateId: number): Promise<EvaluationItem[]> {
  return request<EvaluationItem[]>(`/hr/evaluation-templates/${templateId}/items`)
}

export function createEvaluationItem(input: EvaluationItemCreateInput): Promise<EvaluationItem> {
  return request<EvaluationItem>('/hr/evaluation-items', {
    method: 'POST', body: JSON.stringify(input),
  })
}

export function updateEvaluationItem(
  itemId: number, input: EvaluationItemUpdateInput,
): Promise<EvaluationItem> {
  return request<EvaluationItem>(`/hr/evaluation-items/${itemId}`, {
    method: 'PATCH', body: JSON.stringify(input),
  })
}
