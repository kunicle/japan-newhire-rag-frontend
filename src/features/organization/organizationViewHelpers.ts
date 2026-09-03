import type { OrganizationDepartmentNode } from './types'

const DEVELOPMENT_LABELS: Record<string, string> = {
  'Development Default Department': '개발 기본 부서',
  'Development Default Grade': '개발 기본 직급',
}

export function organizationDisplayLabel(value: string): string {
  return DEVELOPMENT_LABELS[value] ?? value
}

export interface OrganizationViewEmployee {
  employeeId: number
  employeeNumber: string
  employeeName: string
  departmentId: number
  departmentName: string
  jobGradeId: number | null
  jobGradeName: string | null
  jobGradeLevel: number | null
  hireDate: string
}

export function flattenOrganizationViewEmployees(nodes: OrganizationDepartmentNode[]): OrganizationViewEmployee[] {
  const result: OrganizationViewEmployee[] = []
  function visit(items: OrganizationDepartmentNode[]) {
    for (const department of items) {
      for (const employee of department.employees) result.push({ ...employee, departmentName: department.departmentName })
      visit(department.children)
    }
  }
  visit(nodes)
  return result
}

export function filterEmployeesByName(employees: OrganizationViewEmployee[], query: string): OrganizationViewEmployee[] {
  const normalized = query.trim().toLocaleLowerCase()
  if (!normalized) return employees
  return employees.filter((employee) => employee.employeeName.toLocaleLowerCase().includes(normalized))
}

export function countEmployeesByDepartment(employees: OrganizationViewEmployee[]): Map<number, number> {
  const counts = new Map<number, number>()
  for (const employee of employees) counts.set(employee.departmentId, (counts.get(employee.departmentId) ?? 0) + 1)
  return counts
}
