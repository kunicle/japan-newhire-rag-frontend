import { describe, expect, it } from 'vitest'
import {
  assignmentTargetTypeLabel,
  buildCourseEnrollmentRequest,
  type CourseAssignmentFormState,
} from './courseAssignmentHelpers'
import type { AssignmentTargetType } from './hrCourseTypes'

const base: CourseAssignmentFormState = {
  targetType: '', employeeId: 5, departmentId: 9, jobGradeId: 12,
  enrollmentRound: '2026-1', enrollmentStartDate: '2026-01-01',
  enrollmentDueDate: '2026-01-31',
}
const build = (targetType: AssignmentTargetType) =>
  buildCourseEnrollmentRequest({ ...base, targetType })

describe('courseAssignmentHelpers', () => {
  it.each([
    ['EMPLOYEE', '직원'], ['DEPARTMENT', '부서'], ['JOB_GRADE', '직급'],
    ['NEW_HIRE', '신입사원'], ['UNKNOWN', 'UNKNOWN'],
  ])('maps target label %s', (type, expected) => {
    expect(assignmentTargetTypeLabel(type)).toBe(expected)
  })

  it('builds EMPLOYEE with only employee ID', () => {
    expect(build('EMPLOYEE')).toEqual({ ...base, targetType: 'EMPLOYEE',
      departmentId: null, jobGradeId: null })
  })

  it('builds DEPARTMENT and clears stale IDs', () => {
    expect(build('DEPARTMENT')).toEqual({ ...base, targetType: 'DEPARTMENT',
      employeeId: null, jobGradeId: null })
  })

  it('builds JOB_GRADE and clears stale IDs', () => {
    expect(build('JOB_GRADE')).toEqual({ ...base, targetType: 'JOB_GRADE',
      employeeId: null, departmentId: null })
  })

  it('builds NEW_HIRE and clears every stale ID', () => {
    expect(build('NEW_HIRE')).toEqual({ ...base, targetType: 'NEW_HIRE',
      employeeId: null, departmentId: null, jobGradeId: null })
  })
})
