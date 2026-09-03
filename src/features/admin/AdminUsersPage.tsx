import { useCallback, useEffect, useRef, useState } from 'react'
import { Badge, Button, Skeleton } from '../../shared/ui'
import type { RoleType } from '../auth/types'
import { fetchJobGrades, fetchOrganization } from '../organization/organizationApi'
import { flattenDepartments, type FlatDepartment } from '../organization/organizationHelpers'
import type { JobGradeReference } from '../organization/types'
import { activateUser, createUser, deactivateUser, updateUserRoles } from './adminUserApi'
import { ADMIN_ROLE_LABELS, hasRemovedRole, mapAdminUserErrorMessage, validateCreateUserForm } from './adminUserHelpers'
import type { AccountStatus, CreateUserFormValues } from './adminUserTypes'
import styles from './AdminUsersPage.module.css'

const ROLES: RoleType[] = ['EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'SYSTEM_ADMIN']
const EMPTY_FORM: CreateUserFormValues = { email: '', password: '', employeeNumber: '', employeeName: '', departmentId: '', jobGradeId: '', employeeType: '', hireDate: '' }
interface SessionAccount { appUserId: number; employeeId: number; email: string; employeeNumber: string; employeeName: string; accountStatus: AccountStatus; employmentStatus: string; roles: RoleType[]; departmentName: string; jobGradeName: string }

export function AdminUsersPage() {
  const [departments, setDepartments] = useState<FlatDepartment[]>([])
  const [jobGrades, setJobGrades] = useState<JobGradeReference[]>([])
  const [referenceLoading, setReferenceLoading] = useState(true)
  const [referenceError, setReferenceError] = useState<string | null>(null)
  const [form, setForm] = useState<CreateUserFormValues>(EMPTY_FORM)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [accounts, setAccounts] = useState<SessionAccount[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [desiredRoles, setDesiredRoles] = useState<Map<number, Set<RoleType>>>(new Map())
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set())
  const [entryErrors, setEntryErrors] = useState<Map<number, string>>(new Map())
  const mountedRef = useRef(false)
  const referenceRequestIdRef = useRef(0)
  const creatingRef = useRef(false)
  const actionLocksRef = useRef<Set<number>>(new Set())

  const loadReferences = useCallback(async () => {
    const requestId = ++referenceRequestIdRef.current; setReferenceLoading(true); setReferenceError(null)
    try {
      const [organization, grades] = await Promise.all([fetchOrganization(), fetchJobGrades()])
      if (!mountedRef.current || requestId !== referenceRequestIdRef.current) return
      setDepartments(flattenDepartments(organization.departments)); setJobGrades(grades)
    } catch {
      if (mountedRef.current && requestId === referenceRequestIdRef.current) { setDepartments([]); setJobGrades([]); setReferenceError('사용자 생성에 필요한 조직 정보를 불러오지 못했습니다.') }
    } finally { if (mountedRef.current && requestId === referenceRequestIdRef.current) setReferenceLoading(false) }
  }, [])

  useEffect(() => { const effectId = ++referenceRequestIdRef.current; mountedRef.current = true; queueMicrotask(() => { if (mountedRef.current && referenceRequestIdRef.current === effectId) void loadReferences() }); return () => { mountedRef.current = false; referenceRequestIdRef.current += 1 } }, [loadReferences])

  async function submitCreate(event: React.FormEvent) {
    event.preventDefault(); if (creatingRef.current) return
    const validation = validateCreateUserForm(form); if (validation) { setCreateError(validation); return }
    creatingRef.current = true; setCreating(true); setCreateError(null); setCreateSuccess(null)
    try {
      const response = await createUser({ email: form.email, password: form.password, employeeNumber: form.employeeNumber, employeeName: form.employeeName, departmentId: Number(form.departmentId), jobGradeId: Number(form.jobGradeId), employeeType: form.employeeType as 'NEW_HIRE' | 'GENERAL', hireDate: form.hireDate })
      if (!mountedRef.current) return
      const departmentName = departments.find((item) => item.departmentId === Number(form.departmentId))?.departmentName ?? '부서 정보 없음'
      const jobGradeName = jobGrades.find((item) => item.jobGradeId === Number(form.jobGradeId))?.jobGradeName ?? '직급 정보 없음'
      setAccounts((current) => [{ appUserId: response.appUserId, employeeId: response.employeeId, email: form.email, employeeNumber: form.employeeNumber, employeeName: form.employeeName, accountStatus: response.accountStatus, employmentStatus: response.employmentStatus, roles: [], departmentName, jobGradeName }, ...current])
      setDesiredRoles((current) => new Map(current).set(response.appUserId, new Set()))
      setForm(EMPTY_FORM); setCreateSuccess('사용자 계정이 생성되었습니다.')
    } catch (error) { if (mountedRef.current) setCreateError(mapAdminUserErrorMessage(error)) }
    finally { creatingRef.current = false; if (mountedRef.current) setCreating(false) }
  }

  function startEntryAction(appUserId: number): boolean {
    if (actionLocksRef.current.has(appUserId)) return false
    actionLocksRef.current.add(appUserId); setPendingIds((current) => new Set(current).add(appUserId)); setEntryErrors((current) => { const next = new Map(current); next.delete(appUserId); return next }); return true
  }
  function finishEntryAction(appUserId: number) { actionLocksRef.current.delete(appUserId); if (mountedRef.current) setPendingIds((current) => { const next = new Set(current); next.delete(appUserId); return next }) }
  function updateAccount(appUserId: number, update: (account: SessionAccount) => SessionAccount) { setAccounts((current) => current.map((account) => account.appUserId === appUserId ? update(account) : account)) }

  async function changeStatus(account: SessionAccount) {
    if (account.accountStatus === 'LOCKED' || !window.confirm(account.accountStatus === 'ACTIVE' ? '이 계정을 비활성화하시겠습니까?' : '이 계정을 활성화하시겠습니까?') || !startEntryAction(account.appUserId)) return
    try { const response = account.accountStatus === 'ACTIVE' ? await deactivateUser(account.appUserId) : await activateUser(account.appUserId); if (mountedRef.current) updateAccount(account.appUserId, (current) => ({ ...current, accountStatus: response.accountStatus })) }
    catch (error) { if (mountedRef.current) setEntryErrors((current) => new Map(current).set(account.appUserId, mapAdminUserErrorMessage(error))) }
    finally { finishEntryAction(account.appUserId) }
  }

  async function saveRoles(account: SessionAccount) {
    const desired = [...(desiredRoles.get(account.appUserId) ?? new Set<RoleType>())]
    if (hasRemovedRole(account.roles, desired) && !window.confirm('선택 해제한 역할이 제거됩니다. 계속하시겠습니까?')) return
    if (!startEntryAction(account.appUserId)) return
    try { const response = await updateUserRoles(account.appUserId, desired); if (mountedRef.current) { updateAccount(account.appUserId, (current) => ({ ...current, roles: response.roles })); setDesiredRoles((current) => new Map(current).set(account.appUserId, new Set(response.roles))) } }
    catch (error) { if (mountedRef.current) setEntryErrors((current) => new Map(current).set(account.appUserId, mapAdminUserErrorMessage(error))) }
    finally { finishEntryAction(account.appUserId) }
  }

  function toggleRole(appUserId: number, role: RoleType) { setDesiredRoles((current) => { const next = new Map(current); const roles = new Set(next.get(appUserId) ?? []); if (roles.has(role)) roles.delete(role); else roles.add(role); next.set(appUserId, roles); return next }) }

  return <div className={styles.page}><h1>사용자 관리</h1><p className={styles.notice}>현재 시스템은 기존 사용자 조회 API를 제공하지 않아, 이 화면에서는 이번 접속 중 생성한 계정만 이어서 관리할 수 있습니다.</p>
    <section className={styles.section} aria-labelledby="create-user-title"><h2 id="create-user-title">새 사용자 만들기</h2>{referenceLoading ? <div role="status" aria-label="조직 정보를 불러오는 중"><Skeleton lines={3} /></div> : referenceError ? <div className={styles.errorState}><p className={styles.error} role="alert">{referenceError}</p><Button variant="secondary" onClick={() => void loadReferences()}>조직 정보 다시 시도</Button></div> : <form className={styles.form} onSubmit={(event) => void submitCreate(event)}><div className={styles.formGrid}>
      <label>이메일<input type="email" maxLength={100} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>비밀번호<input type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label><label>사번<input maxLength={30} value={form.employeeNumber} onChange={(event) => setForm({ ...form, employeeNumber: event.target.value })} /></label><label>이름<input maxLength={50} value={form.employeeName} onChange={(event) => setForm({ ...form, employeeName: event.target.value })} /></label>
      <label>부서<select value={form.departmentId} onChange={(event) => setForm({ ...form, departmentId: event.target.value })}><option value="">선택</option>{departments.map((department) => <option value={department.departmentId} key={department.departmentId}>{department.departmentName}</option>)}</select></label><label>직급<select value={form.jobGradeId} onChange={(event) => setForm({ ...form, jobGradeId: event.target.value })}><option value="">선택</option>{jobGrades.map((grade) => <option value={grade.jobGradeId} key={grade.jobGradeId}>{grade.jobGradeName}</option>)}</select></label><label>직원 유형<select value={form.employeeType} onChange={(event) => setForm({ ...form, employeeType: event.target.value as CreateUserFormValues['employeeType'] })}><option value="">선택</option><option value="NEW_HIRE">신입사원</option><option value="GENERAL">일반 직원</option></select></label><label>입사일<input type="date" value={form.hireDate} onChange={(event) => setForm({ ...form, hireDate: event.target.value })} /></label>
      </div>{createError && <p className={styles.error} role="alert">{createError}</p>}{createSuccess && <p className={styles.success} role="status">{createSuccess}</p>}<div className={styles.actions}><Button type="submit" loading={creating}>사용자 생성</Button></div></form>}
    </section>
    <section className={styles.section} aria-labelledby="session-users-title"><h2 id="session-users-title">이번 접속에서 생성한 계정</h2>{accounts.length === 0 ? <p className={styles.empty}>이번 접속에서 생성한 계정이 없습니다.</p> : <ul className={styles.accountList}>{accounts.map((account) => { const expanded = expandedIds.has(account.appUserId); const pending = pendingIds.has(account.appUserId); return <li className={styles.accountCard} key={account.appUserId}><div className={styles.accountHeader}><div><h3>{account.employeeName}</h3><p>{account.email}</p></div><Badge variant={account.accountStatus === 'ACTIVE' ? 'success' : account.accountStatus === 'LOCKED' ? 'warning' : 'neutral'}>{account.accountStatus}</Badge></div><p>{account.departmentName} · {account.jobGradeName}</p><p>계정 ID: {account.appUserId}</p><Button type="button" size="sm" variant="secondary" aria-expanded={expanded} onClick={() => setExpandedIds((current) => { const next = new Set(current); if (next.has(account.appUserId)) next.delete(account.appUserId); else next.add(account.appUserId); return next })}>{expanded ? '관리 접기' : '계정 관리'}</Button>{expanded && <div className={styles.management}>{account.accountStatus === 'LOCKED' ? <p>잠긴 계정은 현재 화면에서 해제할 수 없습니다.</p> : <Button type="button" variant="secondary" loading={pending} disabled={pending} onClick={() => void changeStatus(account)}>{account.accountStatus === 'ACTIVE' ? '계정 비활성화' : '계정 활성화'}</Button>}<fieldset className={styles.roles}><legend>역할</legend>{ROLES.map((role) => <label key={role}><input type="checkbox" checked={(desiredRoles.get(account.appUserId) ?? new Set()).has(role)} disabled={pending} onChange={() => toggleRole(account.appUserId, role)} />{ADMIN_ROLE_LABELS[role]}</label>)}</fieldset><Button type="button" loading={pending} disabled={pending} onClick={() => void saveRoles(account)}>역할 저장</Button>{entryErrors.get(account.appUserId) && <p className={styles.error} role="alert">{entryErrors.get(account.appUserId)}</p>}</div>}</li> })}</ul>}
    </section>
  </div>
}
