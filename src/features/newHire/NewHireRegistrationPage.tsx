import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Skeleton } from '../../shared/ui'
import { fetchJobGrades, fetchOrganization } from '../organization/organizationApi'
import { flattenDepartments, type FlatDepartment } from '../organization/organizationHelpers'
import type { JobGradeReference } from '../organization/types'
import { organizationDisplayLabel } from '../organization/organizationViewHelpers'
import { provisionNewHire } from './newHireApi'
import { mapNewHireErrorMessage, validateNewHireForm } from './newHireHelpers'
import type { NewHireFormValues, NewHireSuccessSummary } from './newHireTypes'
import styles from './NewHireRegistrationPage.module.css'

const EMPTY_FORM: NewHireFormValues = { employeeName: '', employeeNumber: '', email: '', password: '', departmentId: '', jobGradeId: '', hireDate: '' }

export function NewHireRegistrationPage() {
  const [departments, setDepartments] = useState<FlatDepartment[]>([])
  const [jobGrades, setJobGrades] = useState<JobGradeReference[]>([])
  const [referenceLoading, setReferenceLoading] = useState(true)
  const [referenceError, setReferenceError] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<NewHireSuccessSummary | null>(null)
  const mountedRef = useRef(false)
  const requestIdRef = useRef(0)
  const submittingRef = useRef(false)

  const loadReferences = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setReferenceLoading(true); setReferenceError(null)
    try {
      const [organization, grades] = await Promise.all([fetchOrganization(), fetchJobGrades()])
      if (!mountedRef.current || requestId !== requestIdRef.current) return
      setDepartments(flattenDepartments(organization.departments)); setJobGrades(grades)
    } catch {
      if (mountedRef.current && requestId === requestIdRef.current) setReferenceError('등록에 필요한 조직 정보를 불러오지 못했습니다.')
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) setReferenceLoading(false)
    }
  }, [])

  useEffect(() => {
    const effectId = ++requestIdRef.current; mountedRef.current = true
    queueMicrotask(() => { if (mountedRef.current && requestIdRef.current === effectId) void loadReferences() })
    return () => { mountedRef.current = false; requestIdRef.current += 1 }
  }, [loadReferences])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (submittingRef.current) return
    const validation = validateNewHireForm(form)
    if (validation) { setError(validation); return }
    submittingRef.current = true; setSubmitting(true); setError(null); setResult(null)
    try {
      const response = await provisionNewHire({
        email: form.email, password: form.password, employeeNumber: form.employeeNumber,
        employeeName: form.employeeName, departmentId: Number(form.departmentId),
        jobGradeId: Number(form.jobGradeId), hireDate: form.hireDate,
      })
      if (!mountedRef.current) return
      setResult({ ...response, email: form.email, employeeNumber: form.employeeNumber,
        employeeName: form.employeeName,
        departmentName: departments.find((item) => item.departmentId === Number(form.departmentId))?.departmentName ?? '부서 정보 없음',
        jobGradeName: jobGrades.find((item) => item.jobGradeId === Number(form.jobGradeId))?.jobGradeName ?? '직급 정보 없음' })
      setForm(EMPTY_FORM)
    } catch (submitError) {
      if (mountedRef.current) setError(mapNewHireErrorMessage(submitError))
    } finally {
      submittingRef.current = false
      if (mountedRef.current) setSubmitting(false)
    }
  }

  return <div className={styles.page}>
    <header className={styles.header}><p className={styles.eyebrow}>HR OPERATIONS</p><h1>신입사원 등록</h1><p>신규 입사자의 계정과 직원 정보를 등록합니다. 직원 유형과 기본 역할은 안전하게 자동 설정됩니다.</p></header>
    <div className={styles.policy}><div><strong>자동 적용</strong><p>직원 유형: 신입사원 · 기본 역할: 직원 · 계정 상태: 활성</p></div><Badge variant="info">HR 전용</Badge></div>
    <section className={styles.section} aria-labelledby="registration-title"><h2 id="registration-title">입사자 정보</h2>
      {referenceLoading ? <div role="status" aria-label="조직 정보를 불러오는 중"><Skeleton lines={4} /></div>
        : referenceError ? <div className={styles.errorState}><p role="alert">{referenceError}</p><Button variant="secondary" onClick={() => void loadReferences()}>다시 시도</Button></div>
        : <form className={styles.form} onSubmit={(event) => void submit(event)}><div className={styles.grid}>
          <label>이름<span>필수</span><input maxLength={50} value={form.employeeName} onChange={(event) => setForm({ ...form, employeeName: event.target.value })} /></label>
          <label>사번<span>필수</span><input maxLength={30} value={form.employeeNumber} onChange={(event) => setForm({ ...form, employeeNumber: event.target.value })} /></label>
          <label>이메일<span>필수</span><input type="email" maxLength={100} autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>비밀번호<span>필수</span><input type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          <label>부서<span>필수</span><select value={form.departmentId} onChange={(event) => setForm({ ...form, departmentId: event.target.value })}><option value="">부서를 선택하세요</option>{departments.map((item) => <option key={item.departmentId} value={item.departmentId}>{organizationDisplayLabel(item.departmentName)}</option>)}</select></label>
          <label>직급<span>필수</span><select value={form.jobGradeId} onChange={(event) => setForm({ ...form, jobGradeId: event.target.value })}><option value="">직급을 선택하세요</option>{jobGrades.map((item) => <option key={item.jobGradeId} value={item.jobGradeId}>{organizationDisplayLabel(item.jobGradeName)}</option>)}</select></label>
          <label>입사일<span>필수</span><input type="date" value={form.hireDate} onChange={(event) => setForm({ ...form, hireDate: event.target.value })} /></label>
        </div>{error && <p className={styles.error} role="alert">{error}</p>}<div className={styles.actions}><Button type="submit" loading={submitting}>신입사원 계정 생성</Button></div></form>}
    </section>
    {result && <section className={styles.result} aria-labelledby="result-title" role="status"><div className={styles.resultHeader}><div><h2 id="result-title">신입사원 계정이 생성되었습니다.</h2><p>온보딩과 교육 배정에 사용할 수 있습니다.</p></div><Badge variant="success">{result.accountStatus}</Badge></div><dl><div><dt>이름</dt><dd>{result.employeeName}</dd></div><div><dt>사번</dt><dd>{result.employeeNumber}</dd></div><div><dt>이메일</dt><dd>{result.email}</dd></div><div><dt>부서</dt><dd>{organizationDisplayLabel(result.departmentName)}</dd></div><div><dt>직급</dt><dd>{organizationDisplayLabel(result.jobGradeName)}</dd></div><div><dt>기본 역할</dt><dd>직원</dd></div></dl><Link className={styles.onboardingLink} to="/hr/onboarding">온보딩 관리로 이동</Link></section>}
  </div>
}
