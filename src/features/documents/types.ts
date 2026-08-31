export interface DocumentCategory {
  documentCategoryId: number
  categoryCode: string
  categoryName: string
}

export interface DocumentUploadResult {
  documentId: number
  documentVersionId: number
  documentProcessingJobId: number
  processingStatus: string
}

export interface DocumentPublicationResult {
  documentId: number
  documentVersionId: number
  publicationStatus: string
  active: boolean
  publishedAt: string | null
  publishedBy: number | null
}

export type AccessScope = 'ALL' | 'RESTRICTED'

export type ConditionOperator = 'AND' | 'OR'

export interface DocumentAccessRuleRequest {
  accessScope: AccessScope
  conditionOperator: ConditionOperator | null
  roles: string[]
  departmentIds: number[]
  minimumJobGradeId: number | null
  newEmployeeOnly: boolean
}

export interface DocumentAccessRuleResult {
  documentId: number
  documentVersionId: number
  accessRuleId: number
  accessScope: AccessScope
  conditionOperator: ConditionOperator
  roleIds: number[]
  departmentIds: number[]
  minimumJobGradeId: number | null
  newEmployeeOnly: boolean
  active: boolean
  createdBy: number
}
