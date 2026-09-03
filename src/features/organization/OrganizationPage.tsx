import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { AppError } from '../../shared/api/errors'
import { Button, Skeleton } from '../../shared/ui'
import { fetchOrganization } from './organizationApi'
import { flattenDepartments } from './organizationHelpers'
import type { OrganizationResponse } from './types'
import { countEmployeesByDepartment, filterEmployeesByName, flattenOrganizationViewEmployees, organizationDisplayLabel } from './organizationViewHelpers'
import styles from './OrganizationPage.module.css'

function organizationErrorMessage(error: unknown): string {
  return error instanceof AppError && error.status === 403 ? '조직 정보를 조회할 권한이 없습니다.' : '조직 정보를 불러오지 못했습니다.'
}

export function OrganizationPage() {
  const [organization, setOrganization] = useState<OrganizationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const mountedRef = useRef(false)
  const latestRequestIdRef = useRef(0)

  const loadOrganization = useCallback(async () => {
    const requestId = ++latestRequestIdRef.current
    setLoading(true); setError(null)
    try {
      const response = await fetchOrganization()
      if (!mountedRef.current || requestId !== latestRequestIdRef.current) return
      setOrganization(response)
      const departments = flattenDepartments(response.departments)
      setSelectedDepartmentId((current) => current != null && departments.some((department) => department.departmentId === current) ? current : departments[0]?.departmentId ?? null)
    } catch (loadError) {
      if (mountedRef.current && requestId === latestRequestIdRef.current) setError(organizationErrorMessage(loadError))
    } finally {
      if (mountedRef.current && requestId === latestRequestIdRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => { const effectId = ++latestRequestIdRef.current; mountedRef.current = true; queueMicrotask(() => { if (mountedRef.current && latestRequestIdRef.current === effectId) void loadOrganization() }); return () => { mountedRef.current = false; latestRequestIdRef.current += 1 } }, [loadOrganization])

  const flatDepartments = useMemo(() => flattenDepartments(organization?.departments ?? []), [organization])
  const employees = useMemo(() => flattenOrganizationViewEmployees(organization?.departments ?? []), [organization])
  const counts = useMemo(() => countEmployeesByDepartment(employees), [employees])
  const selectedEmployees = useMemo(() => employees.filter((employee) => employee.departmentId === selectedDepartmentId), [employees, selectedDepartmentId])
  const visibleEmployees = useMemo(() => filterEmployeesByName(selectedEmployees, searchQuery), [searchQuery, selectedEmployees])

  if (loading && !organization) return <div role="status" aria-label="조직 정보를 불러오는 중"><Skeleton lines={7} /></div>
  if (error && !organization) return <div className={styles.errorState}><p className={styles.error} role="alert">{error}</p><Button variant="secondary" onClick={() => void loadOrganization()}>다시 시도</Button></div>

  return <div className={styles.page}>
    <header className={styles.pageHeader}><h1>조직도</h1><p>부서 구조를 살펴보고 소속 직원 정보를 빠르게 찾아보세요.</p></header>
    {loading && <p className={styles.meta} role="status">조직 정보를 다시 불러오는 중입니다.</p>}
    {error && <div className={styles.errorState}><p className={styles.error} role="alert">{error}</p><Button variant="secondary" onClick={() => void loadOrganization()}>다시 시도</Button></div>}
    {flatDepartments.length === 0 ? <p className={styles.empty}>등록된 부서가 없습니다.</p> : <div className={styles.layout}>
      <section className={styles.departmentPane} aria-labelledby="departments-title"><h2 id="departments-title">부서</h2><ul className={styles.departmentList}>{flatDepartments.map((department) => <li key={department.departmentId}><button type="button" className={styles.departmentButton} aria-pressed={selectedDepartmentId === department.departmentId} style={{ '--department-depth': department.depth } as CSSProperties} onClick={() => { setSelectedDepartmentId(department.departmentId); setSearchQuery('') }}><span><strong>{organizationDisplayLabel(department.departmentName)}</strong><small>{department.departmentCode}</small></span><span className={styles.count}>{counts.get(department.departmentId) ?? 0}명</span></button></li>)}</ul></section>
      <section className={styles.employeePane} aria-labelledby="employees-title"><h2 id="employees-title">소속 직원</h2><div className={styles.search}><label htmlFor="organization-employee-search">직원 이름 검색</label><input id="organization-employee-search" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} /></div>
        {selectedEmployees.length === 0 ? <p className={styles.empty}>소속 직원이 없습니다.</p> : visibleEmployees.length === 0 ? <p className={styles.empty}>검색 결과가 없습니다.</p> : <ul className={styles.employeeList}>{visibleEmployees.map((employee) => <li className={styles.employeeCard} key={employee.employeeId}><h3>{employee.employeeName}</h3><p>{employee.jobGradeName ? organizationDisplayLabel(employee.jobGradeName) : '직급 미지정'}</p><dl><div><dt>사번</dt><dd>{employee.employeeNumber}</dd></div><div><dt>입사일</dt><dd>{employee.hireDate}</dd></div></dl></li>)}</ul>}
      </section>
    </div>}
  </div>
}
