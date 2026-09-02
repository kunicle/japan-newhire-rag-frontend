import type { EvaluationCycleStatus } from './evaluationTypes'

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
