import type {
  AssignmentTargetType,
  CourseEnrollmentCreateInput,
} from './hrCourseTypes'

export interface CourseAssignmentFormState {
  targetType: AssignmentTargetType | ''
  employeeId: number | null
  departmentId: number | null
  jobGradeId: number | null
  enrollmentRound: string
  enrollmentStartDate: string
  enrollmentDueDate: string
}

export function assignmentTargetTypeLabel(type: string): string {
  if (type === 'EMPLOYEE') return '직원'
  if (type === 'DEPARTMENT') return '부서'
  if (type === 'JOB_GRADE') return '직급'
  if (type === 'NEW_HIRE') return '신입사원'
  return type
}

export function buildCourseEnrollmentRequest(
  form: CourseAssignmentFormState & { targetType: AssignmentTargetType },
): CourseEnrollmentCreateInput {
  const base: CourseEnrollmentCreateInput = {
    targetType: form.targetType,
    employeeId: null,
    departmentId: null,
    jobGradeId: null,
    enrollmentRound: form.enrollmentRound,
    enrollmentStartDate: form.enrollmentStartDate,
    enrollmentDueDate: form.enrollmentDueDate,
  }
  if (form.targetType === 'EMPLOYEE') return { ...base, employeeId: form.employeeId }
  if (form.targetType === 'DEPARTMENT') return { ...base, departmentId: form.departmentId }
  if (form.targetType === 'JOB_GRADE') return { ...base, jobGradeId: form.jobGradeId }
  return base
}
