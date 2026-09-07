import { describe, expect, it } from 'vitest'
import {
  buildAccessRuleRequest,
  buildAccessRuleSummaryLines,
  hasRestrictedCondition,
  isAccessRuleFormValid,
  type AccessRuleFormSnapshot,
  type AccessRuleReferences,
} from './accessRuleFormHelpers'

const empty: AccessRuleFormSnapshot = {
  accessScope: 'RESTRICTED',
  conditionOperator: null,
  roles: [],
  departmentIds: [],
  minimumJobGradeId: null,
  newEmployeeOnly: false,
}

const references: AccessRuleReferences = {
  departments: [{ departmentId: 2, departmentCode: 'HR', departmentName: '인사팀', depth: 0 }],
  jobGrades: [{ jobGradeId: 3, jobGradeCode: 'G3', jobGradeName: '직급 3', jobGradeLevel: 3 }],
}

describe('accessRuleFormHelpers', () => {
  it('detects every restricted condition dimension', () => {
    expect(hasRestrictedCondition(empty)).toBe(false)
    expect(hasRestrictedCondition({ ...empty, roles: ['EMPLOYEE'] })).toBe(true)
    expect(hasRestrictedCondition({ ...empty, departmentIds: [2] })).toBe(true)
    expect(hasRestrictedCondition({ ...empty, minimumJobGradeId: 3 })).toBe(true)
    expect(hasRestrictedCondition({ ...empty, newEmployeeOnly: true })).toBe(true)
  })

  it('validates scope, operator, and conditions', () => {
    expect(isAccessRuleFormValid({ ...empty, accessScope: null })).toBe(false)
    expect(isAccessRuleFormValid({ ...empty, accessScope: 'ALL' })).toBe(true)
    expect(isAccessRuleFormValid({ ...empty, roles: ['EMPLOYEE'] })).toBe(false)
    expect(isAccessRuleFormValid({ ...empty, conditionOperator: 'AND' })).toBe(false)
    expect(isAccessRuleFormValid({ ...empty, conditionOperator: 'AND', roles: ['EMPLOYEE'] })).toBe(true)
    expect(isAccessRuleFormValid({ ...empty, conditionOperator: 'OR', newEmployeeOnly: true })).toBe(true)
  })

  it('canonicalizes ALL despite stale restricted values', () => {
    expect(buildAccessRuleRequest({
      accessScope: 'ALL', conditionOperator: 'AND', roles: ['MANAGER'],
      departmentIds: [2], minimumJobGradeId: 3, newEmployeeOnly: true,
    })).toEqual({
      accessScope: 'ALL', conditionOperator: null, roles: [], departmentIds: [],
      minimumJobGradeId: null, newEmployeeOnly: false,
    })
  })

  it('sorts and builds an exact restricted AND payload', () => {
    expect(buildAccessRuleRequest({
      accessScope: 'RESTRICTED', conditionOperator: 'AND',
      roles: ['SYSTEM_ADMIN', 'EMPLOYEE'], departmentIds: [9, 2],
      minimumJobGradeId: 3, newEmployeeOnly: true,
    })).toEqual({
      accessScope: 'RESTRICTED', conditionOperator: 'AND',
      roles: ['EMPLOYEE', 'SYSTEM_ADMIN'], departmentIds: [2, 9],
      minimumJobGradeId: 3, newEmployeeOnly: true,
    })
  })

  it('builds an exact restricted OR payload', () => {
    expect(buildAccessRuleRequest({ ...empty, conditionOperator: 'OR', newEmployeeOnly: true }))
      .toEqual({
        ...empty,
        accessScope: 'RESTRICTED',
        conditionOperator: 'OR',
        newEmployeeOnly: true,
      })
  })

  it('builds ALL and restricted summaries from selected dimensions', () => {
    expect(buildAccessRuleSummaryLines({ ...empty, accessScope: 'ALL' }, null))
      .toEqual(['접근 범위: 전체 직원'])
    expect(buildAccessRuleSummaryLines({
      accessScope: 'RESTRICTED', conditionOperator: 'AND', roles: ['EMPLOYEE'],
      departmentIds: [2], minimumJobGradeId: 3, newEmployeeOnly: true,
    }, references)).toEqual([
      '접근 범위: 조건부 공개', '조건 방식: 모든 조건 충족',
      '역할: 일반 직원', '부서: 인사팀', '최소 직급: 직급 3 (Level 3)',
      '신입 조건: 사용',
    ])
    expect(buildAccessRuleSummaryLines({ ...empty, conditionOperator: 'OR', newEmployeeOnly: true }, references))
      .toEqual(['접근 범위: 조건부 공개', '조건 방식: 조건 중 하나 이상 충족', '신입 조건: 사용'])
  })

  it('omits unresolved optional labels and internal IDs', () => {
    const lines = buildAccessRuleSummaryLines({
      ...empty, conditionOperator: 'AND', departmentIds: [999], minimumJobGradeId: 999,
    }, references)
    expect(lines).toEqual(['접근 범위: 조건부 공개', '조건 방식: 모든 조건 충족'])
    expect(lines.join(' ')).not.toContain('999')
  })
})
