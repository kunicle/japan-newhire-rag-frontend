import { useMemo } from 'react'
import { flattenDepartments } from './organizationHelpers'
import { countEmployeesByDepartment, organizationDisplayLabel, type OrganizationViewEmployee } from './organizationViewHelpers'
import type { OrganizationDepartmentNode } from './types'
import styles from './OrganizationPage.module.css'

export function OrganizationSummary({ departments, employees, onSelect }: {
  departments: OrganizationDepartmentNode[]
  employees: OrganizationViewEmployee[]
  onSelect: (departmentId: number) => void
}) {
  const counts = useMemo(() => countEmployeesByDepartment(
    [...new Map(employees.map(employee => [employee.employeeId, employee])).values()],
  ), [employees])

  function teamList(nodes: OrganizationDepartmentNode[]) {
    return <ul className={styles.summaryTeams}>{nodes.map(team =>
      <li key={team.departmentId}>
        <button type="button" className={styles.summaryTeam} onClick={() => onSelect(team.departmentId)}>
          <strong>{organizationDisplayLabel(team.departmentName)}</strong>
          <span>{counts.get(team.departmentId) ?? 0}명</span>
        </button>
        {team.children.length > 0 && teamList(team.children)}
      </li>)}</ul>
  }

  if (departments.length === 0) return <p className={styles.empty}>등록된 부서가 없습니다.</p>
  return <div className={styles.organizationSummary} aria-label="회사 조직 요약">
    <div className={styles.summaryCompany}>회사 전체</div>
    <ul className={styles.summaryHeadquarters}>
      {departments.filter(department => department.parentDepartmentId === null).map(department => {
        const count = flattenDepartments([department]).reduce((total, child) => total + (counts.get(child.departmentId) ?? 0), 0)
        return <li key={department.departmentId} className={styles.summaryBranch}>
          <button type="button" className={styles.summaryHeadquartersCard} onClick={() => onSelect(department.departmentId)}>
            <strong>{organizationDisplayLabel(department.departmentName)}</strong>
            <span>{count}명</span>
          </button>
          {department.children.length > 0 && teamList(department.children)}
        </li>
      })}
    </ul>
  </div>
}