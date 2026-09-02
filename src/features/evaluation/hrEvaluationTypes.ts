import type { EvaluationCycleStatus, EvaluationStatus } from './evaluationTypes'

export type EvaluationType = 'SELF' | 'MANAGER'

export interface EvaluationCycle {
  evaluationCycleId: number
  cycleName: string
  startDate: string
  endDate: string
  plannedPublishDate: string
  cycleStatus: EvaluationCycleStatus
  createdBy: number
  createdAt: string
  updatedAt: string
}

export interface EvaluationCycleInput {
  cycleName: string
  startDate: string
  endDate: string
  plannedPublishDate: string
}

export interface EvaluationTemplate {
  evaluationTemplateId: number
  evaluationCycleId: number
  templateName: string
  evaluationType: EvaluationType
  templateDescription: string | null
  isActive: boolean
  createdBy: number
  createdAt: string
  updatedAt: string
}

export interface EvaluationTemplateCreateInput {
  evaluationCycleId: number
  templateName: string
  evaluationType: EvaluationType
  templateDescription: string | null
  isActive: boolean
}

export interface EvaluationTemplateUpdateInput {
  templateName: string
  evaluationType: EvaluationType
  templateDescription: string | null
  isActive: boolean
}

export interface EvaluationItem {
  evaluationItemId: number
  evaluationTemplateId: number
  itemName: string
  itemDescription: string | null
  itemOrder: number
  weight: number
  isRequired: boolean
  minimumScore: number | null
  maximumScore: number | null
  createdAt: string
  updatedAt: string
}

export interface EvaluationItemCreateInput {
  evaluationTemplateId: number
  itemName: string
  itemDescription: string | null
  itemOrder: number
  weight: number
  isRequired: boolean
  minimumScore: number | null
  maximumScore: number | null
}

export interface EvaluationItemUpdateInput {
  itemName: string
  itemDescription: string | null
  itemOrder: number
  weight: number
  isRequired: boolean
  minimumScore: number | null
  maximumScore: number | null
}

export interface EvaluationAssignmentInput { evaluationCycleId: number; targetEmployeeId: number }
export interface EvaluationAssignmentResult { evaluationCycleId: number; targetEmployeeId: number; managerEmployeeId: number; selfEvaluationId: number; managerEvaluationId: number }
export type EvaluationProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED'
export interface EvaluationProgressEmployeeSummary { employeeId: number; employeeName: string; departmentId: number | null; departmentName: string | null; jobGradeId: number | null; jobGradeName: string | null }
export interface EvaluationProgressDetail { evaluationId: number; evaluationStatus: EvaluationStatus; progressStatus: EvaluationProgressStatus; submittedAt: string | null }
export interface EvaluationProgressEmployee { employee: EvaluationProgressEmployeeSummary; selfEvaluation: EvaluationProgressDetail | null; managerEvaluation: EvaluationProgressDetail | null }
export interface EvaluationProgressSummary { notStartedCount: number; inProgressCount: number; submittedCount: number }
export interface EvaluationProgress { cycleId: number; cycleName: string; startDate: string; endDate: string; currentCycleStatus: EvaluationCycleStatus; totalTargetCount: number; selfSummary: EvaluationProgressSummary; managerSummary: EvaluationProgressSummary; employees: EvaluationProgressEmployee[] }

export type EvaluationFeedbackType = 'ITEM' | 'OVERALL'
export interface EvaluationPublishPreviewFeedback { evaluationFeedbackId: number; evaluationItemId: number; feedbackType: EvaluationFeedbackType; feedbackContent: string; isVisibleToEmployee: boolean }
export interface EvaluationPublishPreview { evaluationCycleId: number; targetEmployeeId: number; selfEvaluationId: number; managerEvaluationId: number; managerFeedbacks: EvaluationPublishPreviewFeedback[] }
export interface EvaluationPublishInput { publishReason: string | null; visibleManagerFeedbackIds: number[] | null }
export interface EvaluationPublishResult { cycleId: number; targetEmployeeId: number; selfEvaluationId: number; managerEvaluationId: number; selfStatus: EvaluationStatus; managerStatus: EvaluationStatus; publishedAt: string; visibleManagerFeedbackIds: number[]; idempotent: boolean }
