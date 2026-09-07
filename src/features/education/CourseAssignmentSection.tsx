import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Button, Input } from '../../shared/ui'
import { fetchJobGrades, fetchOrganization } from '../organization/organizationApi'
import { flattenDepartments, flattenEmployees } from '../organization/organizationHelpers'
import type { JobGradeReference, OrganizationResponse } from '../organization/types'
import {
  assignmentTargetTypeLabel,
  buildCourseEnrollmentRequest,
  type CourseAssignmentFormState,
} from './courseAssignmentHelpers'
import { createCourseEnrollments } from './hrCourseApi'
import { mapHrCourseErrorMessage } from './hrCourseHelpers'
import type {
  AssignmentTargetType,
  CourseEnrollmentCreateResult,
  HrCourse,
} from './hrCourseTypes'
import styles from './CourseAssignmentSection.module.css'

interface CourseAssignmentSectionProps { course: HrCourse }
const REFERENCE_ERROR = '배정 대상 정보를 불러오지 못했습니다.'

function createInitialForm(course: HrCourse): CourseAssignmentFormState {
  return {
    targetType: '', employeeId: null, departmentId: null, jobGradeId: null,
    enrollmentRound: '', enrollmentStartDate: course.trainingStartDate,
    enrollmentDueDate: course.trainingEndDate,
  }
}

export function CourseAssignmentSection({ course }: CourseAssignmentSectionProps) {
  const [form, setForm] = useState(() => createInitialForm(course))
  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<CourseEnrollmentCreateResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [organization, setOrganization] = useState<OrganizationResponse | null>(null)
  const [organizationLoading, setOrganizationLoading] = useState(true)
  const [organizationError, setOrganizationError] = useState<string | null>(null)
  const [jobGrades, setJobGrades] = useState<JobGradeReference[] | null>(null)
  const [jobGradesLoading, setJobGradesLoading] = useState(true)
  const [jobGradesError, setJobGradesError] = useState<string | null>(null)
  const previousCourseIdRef = useRef(course.courseId)
  const submittingRef = useRef(false)
  const submitRequestIdRef = useRef(0)
  const mountedRef = useRef(false)
  const organizationFetchIdRef = useRef(0)
  const jobGradeFetchIdRef = useRef(0)

  const loadOrganization = useCallback(async () => {
    const requestId = ++organizationFetchIdRef.current
    setOrganizationLoading(true); setOrganizationError(null)
    try {
      const response = await fetchOrganization()
      if (!mountedRef.current || requestId !== organizationFetchIdRef.current) return
      setOrganization(response)
    } catch {
      if (!mountedRef.current || requestId !== organizationFetchIdRef.current) return
      setOrganization(null); setOrganizationError(REFERENCE_ERROR)
    } finally {
      if (mountedRef.current && requestId === organizationFetchIdRef.current) setOrganizationLoading(false)
    }
  }, [])

  const loadJobGrades = useCallback(async () => {
    const requestId = ++jobGradeFetchIdRef.current
    setJobGradesLoading(true); setJobGradesError(null)
    try {
      const response = await fetchJobGrades()
      if (!mountedRef.current || requestId !== jobGradeFetchIdRef.current) return
      setJobGrades(response)
    } catch {
      if (!mountedRef.current || requestId !== jobGradeFetchIdRef.current) return
      setJobGrades(null); setJobGradesError(REFERENCE_ERROR)
    } finally {
      if (mountedRef.current && requestId === jobGradeFetchIdRef.current) setJobGradesLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    queueMicrotask(() => { void loadOrganization(); void loadJobGrades() })
    return () => {
      mountedRef.current = false
      organizationFetchIdRef.current += 1
      jobGradeFetchIdRef.current += 1
    }
  }, [loadJobGrades, loadOrganization])

  useEffect(() => {
    if (previousCourseIdRef.current === course.courseId) return
    previousCourseIdRef.current = course.courseId
    submitRequestIdRef.current += 1
    submittingRef.current = false
    queueMicrotask(() => {
      setForm(createInitialForm(course)); setValidationError(null)
      setSubmitError(null); setResult(null); setSubmitting(false)
    })
  }, [course])

  const employees = organization ? flattenEmployees(organization.departments) : []
  const departments = organization ? flattenDepartments(organization.departments) : []

  function handleTargetTypeChange(targetType: AssignmentTargetType | '') {
    setForm((current) => ({
      ...current, targetType, employeeId: null, departmentId: null, jobGradeId: null,
    }))
    setValidationError(null); setSubmitError(null); setResult(null)
  }

  const dependencyReady = form.targetType === 'EMPLOYEE' || form.targetType === 'DEPARTMENT'
    ? organization !== null && !organizationLoading && !organizationError
    : form.targetType === 'JOB_GRADE'
      ? jobGrades !== null && !jobGradesLoading && !jobGradesError
      : true

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const targetType = form.targetType
    if (!targetType) { setValidationError('대상 유형을 선택해 주세요.'); return }
    if ((targetType === 'EMPLOYEE' && form.employeeId === null) ||
      (targetType === 'DEPARTMENT' && form.departmentId === null) ||
      (targetType === 'JOB_GRADE' && form.jobGradeId === null)) {
      setValidationError('대상을 선택해 주세요.'); return
    }
    if (form.enrollmentDueDate < form.enrollmentStartDate) {
      setValidationError('교육 종료일은 시작일보다 빠를 수 없습니다.'); return
    }
    if (!dependencyReady || submittingRef.current) return
    setValidationError(null); submittingRef.current = true; setSubmitting(true)
    setSubmitError(null); setResult(null)
    const requestId = ++submitRequestIdRef.current
    const submittedCourseId = course.courseId
    try {
      const response = await createCourseEnrollments(
        course.courseId,
        buildCourseEnrollmentRequest({ ...form, targetType }),
      )
      if (!mountedRef.current || requestId !== submitRequestIdRef.current ||
        submittedCourseId !== previousCourseIdRef.current) return
      setResult(response)
      setForm(createInitialForm(course))
    } catch (error) {
      if (mountedRef.current && requestId === submitRequestIdRef.current &&
        submittedCourseId === previousCourseIdRef.current) setSubmitError(mapHrCourseErrorMessage(
        error, '교육 배정에 실패했습니다.', '현재 과정 상태에서는 교육을 배정할 수 없습니다.',
      ))
    } finally {
      if (requestId === submitRequestIdRef.current) {
        submittingRef.current = false
        if (mountedRef.current) setSubmitting(false)
      }
    }
  }

  function renderOrganizationDependency(kind: 'EMPLOYEE' | 'DEPARTMENT') {
    if (organizationLoading) return <p className={styles.status} role="status">배정 대상 정보를 불러오는 중...</p>
    if (organizationError) return <div className={styles.referenceError}><p className={styles.error} role="alert">{organizationError}</p><Button variant="secondary" onClick={() => void loadOrganization()}>다시 시도</Button></div>
    if (kind === 'EMPLOYEE') return employees.length === 0 ? <p className={styles.status}>선택 가능한 직원이 없습니다.</p> : <div className={styles.field}><label htmlFor="assignment-employee">직원</label><select id="assignment-employee" value={form.employeeId ?? ''} onChange={(event) => setForm({ ...form, employeeId: event.target.value ? Number(event.target.value) : null })}><option value="">직원을 선택하세요</option>{employees.map((employee) => <option key={employee.employeeId} value={employee.employeeId}>{employee.employeeName} · {employee.departmentName}{employee.jobGradeName ? ` · ${employee.jobGradeName}` : ''}</option>)}</select></div>
    return departments.length === 0 ? <p className={styles.status}>선택 가능한 부서가 없습니다.</p> : <div className={styles.field}><label htmlFor="assignment-department">부서</label><select id="assignment-department" value={form.departmentId ?? ''} onChange={(event) => setForm({ ...form, departmentId: event.target.value ? Number(event.target.value) : null })}><option value="">부서를 선택하세요</option>{departments.map((department) => <option key={department.departmentId} value={department.departmentId}>{department.departmentName}</option>)}</select></div>
  }

  return <section className={styles.section} aria-labelledby="assignment-title">
    <h2 className={styles.title} id="assignment-title">교육 배정</h2>
    {course.publicationStatus !== 'PUBLIC' ? <p className={styles.notice}>교육을 배정하려면 과정을 먼저 공개해 주세요.</p> : <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
      <fieldset className={styles.fieldset} disabled={submitting}><legend>배정 대상</legend>
        <div className={styles.field}><label htmlFor="assignment-target">대상 유형</label><select id="assignment-target" value={form.targetType} onChange={(event) => handleTargetTypeChange(event.target.value as AssignmentTargetType | '')}><option value="">대상 유형을 선택하세요</option>{(['EMPLOYEE', 'DEPARTMENT', 'JOB_GRADE', 'NEW_HIRE'] as AssignmentTargetType[]).map((type) => <option key={type} value={type}>{assignmentTargetTypeLabel(type)}</option>)}</select></div>
        {form.targetType === 'EMPLOYEE' && renderOrganizationDependency('EMPLOYEE')}
        {form.targetType === 'DEPARTMENT' && renderOrganizationDependency('DEPARTMENT')}
        {form.targetType === 'JOB_GRADE' && (jobGradesLoading ? <p className={styles.status} role="status">직급 정보를 불러오는 중...</p> : jobGradesError ? <div className={styles.referenceError}><p className={styles.error} role="alert">{jobGradesError}</p><Button variant="secondary" onClick={() => void loadJobGrades()}>다시 시도</Button></div> : jobGrades?.length === 0 ? <p className={styles.status}>선택 가능한 직급이 없습니다.</p> : <div className={styles.field}><label htmlFor="assignment-grade">직급</label><select id="assignment-grade" value={form.jobGradeId ?? ''} onChange={(event) => setForm({ ...form, jobGradeId: event.target.value ? Number(event.target.value) : null })}><option value="">직급을 선택하세요</option>{jobGrades?.map((grade) => <option key={grade.jobGradeId} value={grade.jobGradeId}>{grade.jobGradeName}</option>)}</select></div>)}
        {form.targetType === 'NEW_HIRE' && <p className={styles.status}>신입사원 전체가 배정 대상입니다.</p>}
      </fieldset>
      <Input label="배정 차수" required maxLength={30} placeholder="2026-1" value={form.enrollmentRound} disabled={submitting} onChange={(event) => setForm({ ...form, enrollmentRound: event.target.value })}/>
      <div className={styles.dateGrid}><Input label="교육 시작일" type="date" required value={form.enrollmentStartDate} disabled={submitting} onChange={(event) => setForm({ ...form, enrollmentStartDate: event.target.value })}/><Input label="교육 종료일" type="date" required value={form.enrollmentDueDate} disabled={submitting} onChange={(event) => setForm({ ...form, enrollmentDueDate: event.target.value })}/></div>
      {validationError && <p className={styles.error} role="alert">{validationError}</p>}
      {submitError && <p className={styles.error} role="alert">{submitError}</p>}
      {result && <div className={styles.result} role="status"><p>{result.assignedCount > 0 ? '교육 배정이 완료되었습니다.' : result.duplicateCount > 0 ? '이미 모두 배정된 대상입니다.' : '배정할 수 있는 대상이 없습니다.'}</p>{result.assignedCount > 0 && <p>배정 완료: {result.assignedCount}명</p>}{result.duplicateCount > 0 && <p>중복 제외: {result.duplicateCount}명</p>}</div>}
      <Button type="submit" loading={submitting} disabled={submitting || !dependencyReady}>교육 배정</Button>
    </form>}
  </section>
}
