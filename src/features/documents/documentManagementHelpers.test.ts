import { describe, expect, it } from 'vitest'
import type { AccessRuleReferences } from './accessRuleFormHelpers'
import {
  buildAccessRuleReadSummaryLines,
  formatDocumentStatus,
  formatPublicationStatus,
} from './documentManagementHelpers'
import type { DocumentAccessRuleRead } from './documentManagementTypes'

const references: AccessRuleReferences = {
  departments: [{ departmentId: 3, departmentCode: 'HR', departmentName: '인사팀', depth: 0 }],
  jobGrades: [{ jobGradeId: 4, jobGradeCode: 'G4', jobGradeName: '직급 4', jobGradeLevel: 4 }],
}

function restricted(changes: Partial<DocumentAccessRuleRead> = {}): DocumentAccessRuleRead {
  return {
    accessScope: 'RESTRICTED', conditionOperator: 'AND', roles: [],
    departmentIds: [], minimumJobGradeId: null, newEmployeeOnly: false, ...changes,
  }
}

describe('documentManagementHelpers', () => {
  it('formats document status with an unknown fallback', () => {
    expect(formatDocumentStatus('ACTIVE')).toBe('활성')
    expect(formatDocumentStatus('ARCHIVED')).toBe('ARCHIVED')
  })

  it('formats publication statuses with an unknown fallback', () => {
    expect(formatPublicationStatus('PUBLIC')).toBe('공개')
    expect(formatPublicationStatus('DRAFT')).toBe('초안')
    expect(formatPublicationStatus('REVIEW')).toBe('REVIEW')
  })

  it('summarizes ALL', () => {
    expect(buildAccessRuleReadSummaryLines({
      accessScope: 'ALL', conditionOperator: 'OR', roles: [], departmentIds: [],
      minimumJobGradeId: null, newEmployeeOnly: false,
    }, null)).toEqual(['접근 범위: 전체 직원'])
  })

  it('summarizes restricted AND roles', () => {
    expect(buildAccessRuleReadSummaryLines(restricted({ roles: ['HR_MANAGER'] }), references))
      .toEqual(['접근 범위: 조건부 공개', '조건 방식: 모든 조건 충족', '역할: 인사 관리자'])
  })

  it('summarizes restricted OR reference and new-employee conditions', () => {
    expect(buildAccessRuleReadSummaryLines(restricted({
      conditionOperator: 'OR', departmentIds: [3], minimumJobGradeId: 4,
      newEmployeeOnly: true,
    }), references)).toEqual([
      '접근 범위: 조건부 공개', '조건 방식: 조건 중 하나 이상 충족',
      '부서: 인사팀', '최소 직급: 직급 4 (Level 4)', '신입 조건: 사용',
    ])
  })

  it('uses fixed placeholders for missing references without exposing IDs', () => {
    const lines = buildAccessRuleReadSummaryLines(restricted({
      departmentIds: [999], minimumJobGradeId: 888,
    }), references)
    expect(lines).toContain('부서 정보 확인 불가')
    expect(lines).toContain('직급 정보 확인 불가')
    expect(lines.join(' ')).not.toMatch(/999|888/)
  })

  it('uses unresolved placeholders when references are null', () => {
    const lines = buildAccessRuleReadSummaryLines(restricted({
      departmentIds: [3], minimumJobGradeId: 4,
    }), null)
    expect(lines).toContain('부서 정보 확인 불가')
    expect(lines).toContain('직급 정보 확인 불가')
  })
})
