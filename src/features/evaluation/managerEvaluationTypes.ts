import type { EvaluationCycleStatus, EvaluationStatus } from './evaluationTypes'

export interface EvaluationEmployeeSummary {
  employeeId: number
  employeeName: string
  departmentId: number
  departmentName: string
  jobGradeId: number
  jobGradeName: string
}

export interface ManagerEvaluationSummary {
  evaluationId: number
  evaluationCycleId: number
  evaluationStatus: EvaluationStatus
  currentCycleStatus: EvaluationCycleStatus
  targetEmployee: EvaluationEmployeeSummary
}

export interface ManagerEvaluationItem {
  evaluationItemId: number
  itemOrder: number
  itemName: string
  itemDescription: string
  weight: number
  isRequired: boolean
  minimumScore: number
  maximumScore: number
  score: number | null
  itemFeedback: string | null
}

export interface ManagerEvaluationDetail {
  evaluationId: number
  evaluationCycleId: number
  evaluationTemplateId: number
  targetEmployeeId: number
  evaluationStatus: EvaluationStatus
  currentCycleStatus: EvaluationCycleStatus
  targetEmployee: EvaluationEmployeeSummary
  items: ManagerEvaluationItem[]
  overallFeedback: string | null
}

export interface ManagerEvaluationItemDraftInput {
  evaluationItemId: number
  score: number | null
  itemFeedback: string | null
}

export interface ManagerEvaluationDraftInput {
  items: ManagerEvaluationItemDraftInput[]
  overallFeedback: string | null
}

export interface ManagerEvaluationProgressDetail {
  evaluationId: number
  evaluationStatus: EvaluationStatus
  submittedAt: string | null
}

export interface ManagerEvaluationProgressEmployee {
  employee: EvaluationEmployeeSummary
  selfEvaluation: ManagerEvaluationProgressDetail | null
  managerEvaluation: ManagerEvaluationProgressDetail | null
  completed: boolean
}

export interface ManagerEvaluationProgress {
  cycleId: number
  cycleName: string
  totalEmployees: number
  completedEmployees: number
  completionRate: number
  selfCompletedCount: number
  managerCompletedCount: number
  employees: ManagerEvaluationProgressEmployee[]
}
