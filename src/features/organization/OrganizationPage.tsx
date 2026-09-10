import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCurrentRoles } from '../auth/AuthContext'
import { AppError } from '../../shared/api/errors'
import { Button, Skeleton } from '../../shared/ui'
import { fetchOrganization } from './organizationApi'
import { flattenDepartments } from './organizationHelpers'
import type { OrganizationDepartmentNode, OrganizationResponse } from './types'
import { flattenOrganizationViewEmployees, organizationDisplayLabel, type OrganizationViewEmployee } from './organizationViewHelpers'
import { buildOrganizationChart, CARD_HEIGHT, CARD_WIDTH, filterChartEmployees } from './organizationChart'
import { DepartmentEditDialog, EmployeeEditDialog } from './OrganizationEditDialog'
import styles from './OrganizationPage.module.css'

function findDepartment(nodes: OrganizationDepartmentNode[], id: number): OrganizationDepartmentNode | undefined {
  for (const node of nodes) {
    if (node.departmentId === id) return node
    const found = findDepartment(node.children, id)
    if (found) return found
  }
}

export function OrganizationPage() {
  const { roles } = useCurrentRoles()
  const canEdit = roles.includes('HR_MANAGER')
  const [organization, setOrganization] = useState<OrganizationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editing, setEditing] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<OrganizationViewEmployee | null>(null)
  const [editingDepartment, setEditingDepartment] = useState<OrganizationDepartmentNode | null | undefined>(undefined)
  const mounted = useRef(false)
  const requestId = useRef(0)
  const loadOrganization = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true); setError(null)
    try {
      const response = await fetchOrganization()
      if (!mounted.current || id !== requestId.current) return
      setOrganization(response)
      setSelectedDepartmentId(current => current != null && !flattenDepartments(response.departments).some(value => value.departmentId === current) ? null : current)
    } catch (loadError) {
      if (mounted.current && id === requestId.current) setError(loadError instanceof AppError && loadError.status === 403 ? '조직 정보를 조회할 권한이 없습니다.' : '조직 정보를 불러오지 못했습니다.')
    } finally { if (mounted.current && id === requestId.current) setLoading(false) }
  }, [])
  useEffect(() => {
    const effectId = ++requestId.current
    mounted.current = true
    queueMicrotask(() => {
      if (mounted.current && requestId.current === effectId) void loadOrganization()
    })
    return () => { mounted.current = false; requestId.current += 1 }
  }, [loadOrganization])
  const departments = useMemo(() => flattenDepartments(organization?.departments ?? []), [organization])
  const employees = useMemo(() => flattenOrganizationViewEmployees(organization?.departments ?? []), [organization])
  const visible = useMemo(() => filterChartEmployees(employees, selectedDepartmentId, searchQuery), [employees, selectedDepartmentId, searchQuery])
  const chart = useMemo(() => buildOrganizationChart(visible), [visible])
  const selectedDepartment = selectedDepartmentId == null ? undefined : findDepartment(organization?.departments ?? [], selectedDepartmentId)
  async function saved() {
    setEditingEmployee(null); setEditingDepartment(undefined)
    setNotice('조직 정보를 저장했습니다.')
    await loadOrganization()
  }
  if (loading && !organization) return <div role="status" aria-label="조직 정보를 불러오는 중"><Skeleton lines={7} /></div>
  return <div className={styles.page}>
    <header className={styles.pageHeader}><div><h1>조직도</h1><p>회사 구성원과 보고 체계를 확인할 수 있습니다.</p></div>
      {canEdit && <Button variant={editing ? 'secondary' : 'primary'} aria-pressed={editing} disabled={loading || !organization} onClick={() => setEditing(value => !value)}>{editing ? '편집 완료' : '조직 편집'}</Button>}
    </header>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    {error && <div className={styles.errorState}><p className={styles.error} role="alert">{error}</p><Button variant="secondary" onClick={() => void loadOrganization()}>다시 시도</Button></div>}
    {organization && <>
      <section className={styles.toolbar} aria-label="조직도 검색">
        <label>부서<select value={selectedDepartmentId ?? ''} onChange={event => setSelectedDepartmentId(event.target.value ? Number(event.target.value) : null)}>
          <option value="">전체 부서</option>{departments.map(department => <option key={department.departmentId} value={department.departmentId}>{'　'.repeat(department.depth)}{organizationDisplayLabel(department.departmentName)}</option>)}
        </select></label>
        <label className={styles.search}>이름 검색<input type="search" placeholder="직원 이름 검색" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} /></label>
      </section>
      {canEdit && editing && <div className={styles.editToolbar}><p>직원 카드에서 조직정보를 수정할 수 있습니다.</p><div className={styles.actions}>
        <Button variant="secondary" size="sm" disabled={loading} onClick={() => setEditingDepartment(null)}>부서 생성</Button>
        {selectedDepartment && <Button variant="secondary" size="sm" disabled={loading} onClick={() => setEditingDepartment(selectedDepartment)}>부서 수정</Button>}
      </div></div>}
      <section className={styles.chartSection} aria-label="직속 상급자 조직도">
        <div className={styles.chartHeader}><h2>{selectedDepartment ? organizationDisplayLabel(selectedDepartment.departmentName) : '전체 조직'}</h2><span>{employees.length}명의 구성원 · {departments.length}개 부서</span></div>
        {(selectedDepartmentId != null || searchQuery.trim()) && <p className={styles.meta}>검색된 직원의 보고 체계를 확인할 수 있도록 상급자도 함께 표시합니다.</p>}
        {loading && <p className={styles.meta} role="status">조직 정보를 다시 불러오는 중입니다.</p>}
        {chart.hasCycle && <p className={styles.error} role="alert">순환 보고 관계가 있어 일부 연결선을 표시하지 못했습니다. 인사 관리자에게 확인해주세요.</p>}
        {chart.nodes.length === 0 ? <p className={styles.empty}>{employees.length ? '검색 결과가 없습니다.' : '등록된 직원이 없습니다.'}</p> :
          <div className={styles.chartScroll} tabIndex={0} role="region" aria-label="조직도 — 좌우로 스크롤할 수 있습니다">
            <div className={styles.chart} style={{ width: chart.width, height: chart.height }}>
              <svg className={styles.connections} width={chart.width} height={chart.height} aria-hidden="true">{chart.edges.map(({ from, to }) => {
                const startX = from.x + CARD_WIDTH / 2, startY = from.y + CARD_HEIGHT, endX = to.x + CARD_WIDTH / 2
                const bendY = to.y - 32
                return <path key={to.employee.employeeId} d={'M ' + startX + ' ' + startY + ' V ' + bendY + ' H ' + endX + ' V ' + to.y} />
              })}</svg>
              <ul className={styles.employeeList}>{chart.nodes.map(({ employee, x, y }) => <li className={styles.employeeCard} key={employee.employeeId} style={{ left: x, top: y, width: CARD_WIDTH, height: CARD_HEIGHT }}>
                <p className={styles.departmentName} title={employee.departmentName}>{organizationDisplayLabel(employee.departmentName)}</p>
                <p className={styles.grade}>{employee.jobGradeName ? organizationDisplayLabel(employee.jobGradeName) : '직급 미지정'}</p>
                <h3 title={employee.employeeName}>{employee.employeeName}</h3>
                <p className={styles.hireDate}>입사일 <time dateTime={employee.hireDate}>{employee.hireDate}</time></p>
                {canEdit && editing && <Button variant="ghost" size="sm" disabled={loading} aria-label={employee.employeeName + ' 조직정보 편집'} onClick={() => setEditingEmployee(employee)}>편집</Button>}
              </li>)}</ul>
            </div>
          </div>}
      </section>
    </>}
    {canEdit && editing && editingEmployee && <EmployeeEditDialog employee={editingEmployee} employees={employees} departments={organization?.departments ?? []} onClose={() => setEditingEmployee(null)} onSaved={saved} />}
    {canEdit && editing && editingDepartment !== undefined && <DepartmentEditDialog department={editingDepartment} departments={organization?.departments ?? []} onClose={() => setEditingDepartment(undefined)} onSaved={saved} />}
  </div>
}
