import type { RoleType } from '../auth/types'
import type { AccessScope, ConditionOperator } from './types'

export interface DocumentManagementListItem {
  documentId: number
  documentName: string
  documentCategoryId: number
  categoryCode: string
  categoryName: string
  documentStatus: string
  latestVersionId: number | null
  latestVersionName: string | null
  latestVersionPublicationStatus: string | null
  latestVersionIsActive: boolean
  createdAt: string
}

export interface DocumentAccessRuleRead {
  accessScope: AccessScope
  conditionOperator: ConditionOperator
  roles: RoleType[]
  departmentIds: number[]
  minimumJobGradeId: number | null
  newEmployeeOnly: boolean
}

export interface DocumentManagementVersion {
  documentVersionId: number
  versionName: string
  publicationStatus: string
  isActive: boolean
  originalFileName: string
  effectiveDate: string
  expirationDate: string | null
  publishedAt: string | null
  createdAt: string
  accessRule: DocumentAccessRuleRead | null
}

export interface DocumentManagementDetail {
  documentId: number
  documentName: string
  documentDescription: string | null
  documentCategoryId: number
  categoryCode: string
  categoryName: string
  documentStatus: string
  createdAt: string
  versions: DocumentManagementVersion[]
}
