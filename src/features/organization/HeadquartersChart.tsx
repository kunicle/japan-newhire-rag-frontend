import { Button } from '../../shared/ui'
import { flattenDepartments } from './organizationHelpers'
import { compareEmployees, type ChartNode, type OrganizationChart } from './organizationChart'
import type { OrganizationDepartmentNode } from './types'
import { organizationDisplayLabel, type OrganizationViewEmployee } from './organizationViewHelpers'
import styles from './OrganizationPage.module.css'

export function HeadquartersChart({ chart, department, editing, busy, onEdit }: {
  chart: OrganizationChart
  department?: OrganizationDepartmentNode
  editing: boolean
  busy: boolean
  onEdit: (employee: OrganizationViewEmployee) => void
}) {
  const children = new Map<number, ChartNode[]>()
  const managers = new Map<number, ChartNode>()
  for (const edge of chart.edges) {
    managers.set(edge.to.employee.employeeId, edge.from)

    const siblings = children.get(edge.from.employee.employeeId) ?? []
    siblings.push(edge.to)
    children.set(edge.from.employee.employeeId, siblings)
  }
  const groups = new Map<number, ChartNode[]>()
  for (const node of chart.nodes) {
    const members = groups.get(node.employee.departmentId) ?? []
    members.push(node)
    groups.set(node.employee.departmentId, members)
  }
  const headquarters = department?.parentDepartmentId === null
  const teams = headquarters ? flattenDepartments(department.children) : []
  const roots = chart.nodes.filter(node => !managers.has(node.employee.employeeId))
    .sort((a, b) => compareEmployees(a.employee, b.employee))
  const representative = headquarters ? roots[0] : undefined
  const topNodes = headquarters ? chart.nodes.filter(node =>
    node.employee.departmentId === department.departmentId || node === representative) : []
  const topIds = new Set(topNodes.map(node => node.employee.employeeId))

  function tree(nodes: ChartNode[], label?: string) {
    const allowed = new Set(nodes.map(node => node.employee.employeeId))
    const localRoots = nodes.filter(node => !allowed.has(managers.get(node.employee.employeeId)?.employee.employeeId ?? -1))
      .sort((a, b) => compareEmployees(a.employee, b.employee))
    return <ul className={styles.teamEmployeeGrid} aria-label={label}>{localRoots.map(root => branch(root, allowed))}</ul>
  }
  function branch(node: ChartNode, allowed: Set<number>) {
    const { employee } = node
    const directReports = (children.get(employee.employeeId) ?? []).filter(child => allowed.has(child.employee.employeeId))
    const manager = managers.get(employee.employeeId)?.employee
    const externalManager = manager && !allowed.has(manager.employeeId) ? manager : undefined
    return <li key={employee.employeeId} className={directReports.length ? styles.teamManagerBranch : styles.teamLeafBranch}
      data-manager-id={manager?.employeeId}>
      <article className={styles.employeeCard + ' ' + styles.teamEmployeeCard} data-employee-id={employee.employeeId} title={externalManager ? '직속 관리자: ' + externalManager.employeeName : undefined}>
        <p className={styles.grade}>{employee.jobGradeName ? organizationDisplayLabel(employee.jobGradeName) : '직급 미지정'}</p>
        <h3>{employee.employeeName}</h3>
        <p className={styles.hireDate}>입사일 <time dateTime={employee.hireDate}>{employee.hireDate}</time></p>
        {editing && <Button variant="ghost" size="sm" disabled={busy} aria-label={employee.employeeName + ' 조직정보 편집'} onClick={() => onEdit(employee)}>편집</Button>}
      </article>
      {directReports.length > 0 && <ul className={styles.teamReports} aria-label={employee.employeeName + '의 직속 부하'}>
        {directReports.map(child => branch(child, allowed))}
      </ul>}
    </li>
  }

  if (!headquarters) return <div className={styles.singleTeamChart} aria-label="직원 상세 조직도">
    {tree(chart.nodes)}
  </div>

  return <div aria-label="본부 직원 조직도" className={styles.headquartersDetail}>
    {topNodes.length > 0 && <div className={styles.headquartersLeaders} aria-label="본부 상단 관리자">
      {tree(topNodes)}
    </div>}
    {topNodes.length === 1 && <svg className={styles.leaderConnections} viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
      {teams.map((team, index) => chart.edges.some(edge => edge.from === topNodes[0] && edge.to.employee.departmentId === team.departmentId)
        ? <path key={team.departmentId} d={'M 50 0 V 12 H ' + ((index + 0.5) * 100 / Math.min(3, teams.length)) + ' V 24'} /> : null)}
    </svg>}
    <div className={styles.headquartersTeams}
      style={{ gridTemplateColumns: 'repeat(' + Math.min(3, Math.max(1, teams.length)) + ', minmax(0, 1fr))' }}>
      {teams.map(team => {
        const members = groups.get(team.departmentId) ?? []
        const localMembers = members.filter(node => !topIds.has(node.employee.employeeId))
        const linked = chart.edges.some(edge => topIds.has(edge.from.employee.employeeId) && edge.to.employee.departmentId === team.departmentId && !topIds.has(edge.to.employee.employeeId))
        return <section key={team.departmentId} className={styles.teamPanel} data-team-id={team.departmentId} data-linked-to-leader={linked || undefined}>
          <header className={styles.teamPanelHeader}><h4>{organizationDisplayLabel(team.departmentName)}</h4><span>{members.length}명</span></header>
          {localMembers.length ? tree(localMembers) : <p className={styles.teamEmpty}>{members.length ? '상단에 표시된 구성원입니다.' : '표시할 직원이 없습니다.'}</p>}
        </section>
      })}
    </div>
  </div>
}