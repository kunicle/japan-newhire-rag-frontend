import {
  ROLE_LABELS,
  type AccessRuleFormSnapshot,
  type AccessRuleReferences,
} from './accessRuleFormHelpers'
import type { DocumentAccessRuleRead } from './documentManagementTypes'

export function formatDocumentStatus(status: string): string {
  return status === 'ACTIVE' ? '활성' : status
}

export function formatPublicationStatus(status: string): string {
  if (status === 'PUBLIC') return '공개'
  if (status === 'DRAFT') return '초안'
  return status
}

export function toAccessRuleFormSnapshot(
  rule: DocumentAccessRuleRead,
): AccessRuleFormSnapshot {
  if (rule.accessScope === 'ALL') {
    return {
      accessScope: 'ALL',
      conditionOperator: null,
      roles: [],
      departmentIds: [],
      minimumJobGradeId: null,
      newEmployeeOnly: false,
    }
  }

  return {
    accessScope: 'RESTRICTED',
    conditionOperator: rule.conditionOperator,
    roles: [...rule.roles],
    departmentIds: [...rule.departmentIds],
    minimumJobGradeId: rule.minimumJobGradeId,
    newEmployeeOnly: rule.newEmployeeOnly,
  }
}

export function buildAccessRuleReadSummaryLines(
  rule: DocumentAccessRuleRead,
  references: AccessRuleReferences | null,
): string[] {
  if (rule.accessScope === 'ALL') return ['접근 범위: 전체 직원']

  const lines = ['접근 범위: 조건부 공개']
  lines.push(rule.conditionOperator === 'AND'
    ? '조건 방식: 모든 조건 충족'
    : '조건 방식: 조건 중 하나 이상 충족')
  if (rule.roles.length > 0) {
    lines.push(`역할: ${rule.roles.map((role) => ROLE_LABELS[role]).join(', ')}`)
  }
  if (rule.departmentIds.length > 0) {
    const names = references && rule.departmentIds.map((id) =>
      references.departments.find((department) => department.departmentId === id)
        ?.departmentName,
    )
    lines.push(names && names.every((name): name is string => Boolean(name))
      ? `부서: ${names.join(', ')}`
      : '부서 정보 확인 불가')
  }
  if (rule.minimumJobGradeId !== null) {
    const grade = references?.jobGrades.find(
      (item) => item.jobGradeId === rule.minimumJobGradeId,
    )
    lines.push(grade
      ? `최소 직급: ${grade.jobGradeName} (Level ${grade.jobGradeLevel})`
      : '직급 정보 확인 불가')
  }
  if (rule.newEmployeeOnly) lines.push('신입 조건: 사용')
  return lines
}
