import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '../../shared/ui'
import { AppError } from '../../shared/api/errors'
import { createDepartment, fetchJobGrades, updateDepartment, updateEmployeeOrganization } from './organizationApi'
import { flattenDepartments } from './organizationHelpers'
import { compareEmployees, wouldCreateManagerCycle } from './organizationChart'
import { organizationDisplayLabel, type OrganizationViewEmployee } from './organizationViewHelpers'
import type { JobGradeReference, OrganizationDepartmentNode } from './types'
import styles from './OrganizationPage.module.css'

function editError(error: unknown): string {
  if (!(error instanceof AppError)) return '저장하지 못했습니다. 입력값을 확인하고 다시 시도해주세요.'
  const messages: Record<string, string> = {
    SELF_MANAGER_NOT_ALLOWED: '자기 자신을 상급자로 지정할 수 없습니다.',
    MANAGER_CYCLE_NOT_ALLOWED: '보고 관계가 순환하도록 상급자를 지정할 수 없습니다.',
    MANAGER_GRADE_NOT_ALLOWED: '직원보다 낮은 직급의 상급자를 지정할 수 없습니다. 직속 부하의 직급도 확인해주세요.',
    DEPARTMENT_CYCLE_NOT_ALLOWED: '자신이나 하위 부서를 상위 부서로 지정할 수 없습니다.',
    DEPARTMENT_CODE_CONFLICT: '이미 사용 중인 부서 코드입니다.',
  }
  if (error.status === 403) return '조직 정보를 수정할 권한이 없습니다.'
  if (error.status === 404) return '직원, 부서 또는 직급 정보가 변경되었습니다. 화면을 새로고침해주세요.'
  return messages[error.code] ?? '저장하지 못했습니다. 입력값을 확인하고 다시 시도해주세요.'
}

function EditDialog({ title, busy, onClose, children }: { title: string; busy: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    const previous = document.activeElement as HTMLElement | null
    dialog.showModal()
    return () => { dialog.close(); previous?.focus() }
  }, [])
  return <dialog ref={ref} className={styles.dialog} aria-labelledby="organization-edit-title" onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
    <h2 id="organization-edit-title">{title}</h2>{children}
  </dialog>
}

export function EmployeeEditDialog({ employee, employees, departments, onClose, onSaved }: {
  employee: OrganizationViewEmployee; employees: OrganizationViewEmployee[]; departments: OrganizationDepartmentNode[]
  onClose: () => void; onSaved: () => Promise<void>
}) {
  const [departmentId, setDepartmentId] = useState(String(employee.departmentId))
  const [gradeId, setGradeId] = useState(String(employee.jobGradeId ?? ''))
  const [managerId, setManagerId] = useState(String(employee.managerEmployeeId ?? ''))
  const [grades, setGrades] = useState<JobGradeReference[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    fetchJobGrades().then(values => { if (active) setGrades(values) })
      .catch(() => { if (active) setError('직급 목록을 불러오지 못했습니다.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [retry])
  const departmentOptions = flattenDepartments(departments)
  const validDepartment = departmentId === String(employee.departmentId)
    || departmentOptions.some(value => String(value.departmentId) === departmentId && value.parentDepartmentId !== null)
  const grade = grades.find(value => value.jobGradeId === Number(gradeId))
  const candidates = employees.filter(candidate => candidate.employeeId !== employee.employeeId
    && !wouldCreateManagerCycle(employees, employee.employeeId, candidate.employeeId)
    && grade != null && candidate.jobGradeLevel != null && candidate.jobGradeLevel <= grade.jobGradeLevel).sort(compareEmployees)
  const validManager = managerId === '' || candidates.some(candidate => candidate.employeeId === Number(managerId))
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy || loading || !grade || !validManager || !validDepartment) return
    setBusy(true); setError('')
    try {
      await updateEmployeeOrganization(employee.employeeId, { departmentId: Number(departmentId), jobGradeId: grade.jobGradeId, managerEmployeeId: managerId === '' ? null : Number(managerId) })
      await onSaved()
    } catch (saveError) { setError(editError(saveError)); setBusy(false) }
  }
  return <EditDialog title="직원 조직정보 수정" busy={busy} onClose={onClose}><form onSubmit={event => void submit(event)} className={styles.form}>
    <p className={styles.readOnlyName}>{employee.employeeName}</p>
    <fieldset disabled={busy}><label>부서<select required value={departmentId} onChange={event => setDepartmentId(event.target.value)}>{departmentOptions.map(department =>
      <option key={department.departmentId} value={department.departmentId} disabled={department.parentDepartmentId === null}>{'　'.repeat(department.depth)}{organizationDisplayLabel(department.departmentName)}</option>)}</select></label>
    <label>직급<select required disabled={loading} value={gradeId} onChange={event => setGradeId(event.target.value)}>
      <option value="">직급 선택</option>{!loading && !grades.some(value => String(value.jobGradeId) === gradeId) && gradeId && <option value={gradeId} disabled>{employee.jobGradeName} (선택 불가)</option>}
      {grades.map(value => <option key={value.jobGradeId} value={value.jobGradeId}>{organizationDisplayLabel(value.jobGradeName)}</option>)}</select></label>
    <label>직속 상급자<select disabled={loading} value={managerId} onChange={event => setManagerId(event.target.value)}>
      <option value="">상급자 없음</option>{!validManager && managerId && <option value={managerId} disabled>현재 상급자 — 다시 선택해주세요</option>}
      {candidates.map(candidate => <option key={candidate.employeeId} value={candidate.employeeId}>{candidate.employeeName} · {organizationDisplayLabel(candidate.departmentName)} · {candidate.jobGradeName}</option>)}
    </select></label></fieldset>
    {!loading && !validManager && <p className={styles.error} role="alert">선택한 직급에 맞는 상급자를 다시 선택해주세요.</p>}
    {loading && <p role="status">직급 목록을 불러오는 중입니다.</p>}
    {error && <p className={styles.error} role="alert">{error}</p>}
    {!loading && grades.length === 0 && <Button variant="secondary" onClick={() => { setLoading(true); setError(''); setRetry(value => value + 1) }}>직급 다시 불러오기</Button>}
    <footer className={styles.actions}><Button variant="secondary" disabled={busy} onClick={onClose}>취소</Button><Button type="submit" loading={busy} disabled={loading || !grade || !validManager || !validDepartment}>저장</Button></footer>
  </form></EditDialog>
}

export function DepartmentEditDialog({ department, departments, onClose, onSaved }: {
  department: OrganizationDepartmentNode | null; departments: OrganizationDepartmentNode[]
  onClose: () => void; onSaved: () => Promise<void>
}) {
  const [name, setName] = useState(department?.departmentName ?? '')
  const [code, setCode] = useState('')
  const [parentId, setParentId] = useState(String(department?.parentDepartmentId ?? ''))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const excluded = new Set(department ? flattenDepartments([department]).map(value => value.departmentId) : [])
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy || !name.trim() || (!department && !code.trim())) return
    setBusy(true); setError('')
    try {
      const body = { departmentName: name.trim(), parentDepartmentId: parentId === '' ? null : Number(parentId) }
      if (department) await updateDepartment(department.departmentId, body)
      else await createDepartment({ ...body, departmentCode: code.trim() })
      await onSaved()
    } catch (saveError) { setError(editError(saveError)); setBusy(false) }
  }
  return <EditDialog title={department ? '부서 정보 수정' : '부서 생성'} busy={busy} onClose={onClose}><form className={styles.form} onSubmit={event => void submit(event)}>
    <fieldset disabled={busy}>{!department && <label>부서 코드<input required maxLength={30} value={code} onChange={event => setCode(event.target.value)} /></label>}
    <label>부서명<input required maxLength={100} value={name} onChange={event => setName(event.target.value)} /></label>
    <label>상위 부서<select value={parentId} onChange={event => setParentId(event.target.value)}><option value="">최상위 부서</option>
      {flattenDepartments(departments).filter(value => !excluded.has(value.departmentId)).map(value => <option key={value.departmentId} value={value.departmentId}>{'　'.repeat(value.depth)}{organizationDisplayLabel(value.departmentName)}</option>)}
    </select></label></fieldset>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <footer className={styles.actions}><Button variant="secondary" disabled={busy} onClick={onClose}>취소</Button><Button type="submit" loading={busy} disabled={!name.trim() || (!department && !code.trim())}>저장</Button></footer>
  </form></EditDialog>
}
