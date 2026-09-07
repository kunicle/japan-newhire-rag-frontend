import type { RoleType } from '../auth/types'
import type { FlatDepartment } from '../organization/organizationHelpers'
import type { JobGradeReference } from '../organization/types'
import type {
  AccessScope,
  ConditionOperator,
  DocumentAccessRuleRequest,
} from './types'

export const ROLE_LABELS: Record<RoleType, string> = {
  EMPLOYEE: '일반 직원',
  MANAGER: '관리자',
  HR_MANAGER: '인사 관리자',
  SYSTEM_ADMIN: '시스템 관리자',
}

export interface AccessRuleFormSnapshot {
  accessScope: AccessScope | null
  conditionOperator: ConditionOperator | null
  roles: RoleType[]
  departmentIds: number[]
  minimumJobGradeId: number | null
  newEmployeeOnly: boolean
}

export interface AccessRuleReferences {
  departments: FlatDepartment[]
  jobGrades: JobGradeReference[]
}

export function hasRestrictedCondition(form: AccessRuleFormSnapshot): boolean {
  return form.roles.length > 0 ||
    form.departmentIds.length > 0 ||
    form.minimumJobGradeId !== null ||
    form.newEmployeeOnly
}

export function isAccessRuleFormValid(form: AccessRuleFormSnapshot): boolean {
  if (form.accessScope === null) return false
  if (form.accessScope === 'ALL') return true
  return form.conditionOperator !== null && hasRestrictedCondition(form)
}

export function buildAccessRuleRequest(
  form: AccessRuleFormSnapshot,
): DocumentAccessRuleRequest {
  if (form.accessScope === 'ALL') {
    return {
      accessScope: 'ALL',
      conditionOperator: null,
      roles: [],
      departmentIds: [],
      minimumJobGradeId: null,
      newEmployeeOnly: false,
    }
  }

  if (form.accessScope !== 'RESTRICTED' || form.conditionOperator === null) {
    throw new Error('Invalid access-rule form')
  }

  return {
    accessScope: 'RESTRICTED',
    conditionOperator: form.conditionOperator,
    roles: [...form.roles].sort(),
    departmentIds: [...form.departmentIds].sort((left, right) => left - right),
    minimumJobGradeId: form.minimumJobGradeId,
    newEmployeeOnly: form.newEmployeeOnly,
  }
}

export function buildAccessRuleSummaryLines(
  form: AccessRuleFormSnapshot,
  references: AccessRuleReferences | null,
): string[] {
  if (form.accessScope === 'ALL') return ['접근 범위: 전체 직원']
  if (form.accessScope !== 'RESTRICTED') return []

  const lines = ['접근 범위: 조건부 공개']
  if (form.conditionOperator === 'AND') {
    lines.push('조건 방식: 모든 조건 충족')
  } else if (form.conditionOperator === 'OR') {
    lines.push('조건 방식: 조건 중 하나 이상 충족')
  }
  if (form.roles.length > 0) {
    lines.push(`역할: ${form.roles.map((role) => ROLE_LABELS[role]).join(', ')}`)
  }
  if (form.departmentIds.length > 0 && references) {
    const names = form.departmentIds.map((id) =>
      references.departments.find((item) => item.departmentId === id)?.departmentName,
    )
    if (names.every((name): name is string => Boolean(name))) {
      lines.push(`부서: ${names.join(', ')}`)
    }
  }
  if (form.minimumJobGradeId !== null && references) {
    const grade = references.jobGrades.find(
      (item) => item.jobGradeId === form.minimumJobGradeId,
    )
    if (grade) {
      lines.push(`최소 직급: ${grade.jobGradeName} (Level ${grade.jobGradeLevel})`)
    }
  }
  if (form.newEmployeeOnly) lines.push('신입 조건: 사용')
  return lines
}
