export type EvaluationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'RETURNED'
  | 'PUBLISHED'

export type EvaluationCycleStatus =
  | 'PLANNED'
  | 'OPEN'
  | 'CLOSED'
  | 'PUBLISHED'

export interface MyEvaluationSummary {
  evaluationId: number
  evaluationCycleId: number
  cycleName: string
  cycleStartDate: string
  cycleEndDate: string
  evaluationStatus: EvaluationStatus
  currentCycleStatus: EvaluationCycleStatus
}

export interface SelfEvaluationItem {
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

export interface SelfEvaluationDetail {
  evaluationId: number
  evaluationCycleId: number
  evaluationTemplateId: number
  evaluationStatus: EvaluationStatus
  currentCycleStatus: EvaluationCycleStatus
  items: SelfEvaluationItem[]
  overallFeedback: string | null
}

export interface SelfEvaluationItemDraftInput {
  evaluationItemId: number
  score: number | null
  itemFeedback: string | null
}

export interface SelfEvaluationDraftInput {
  items: SelfEvaluationItemDraftInput[]
  overallFeedback: string | null
}

export interface EvaluationResultItem {
  evaluationItemId: number
  itemOrder: number
  itemName: string
  itemDescription: string
  weight: number
  isRequired: boolean
  score: number | null
  itemFeedback: string | null
}

export interface EvaluationResultDetail {
  evaluationId: number
  evaluationStatus: EvaluationStatus
  totalScore: number | null
  items: EvaluationResultItem[]
  overallFeedback: string | null
}

export interface EvaluationResultCycle {
  cycleId: number
  cycleName: string
  startDate: string
  endDate: string
  plannedPublishDate: string
}

export interface EvaluationResult {
  cycle: EvaluationResultCycle
  self: EvaluationResultDetail
  manager: EvaluationResultDetail
}
