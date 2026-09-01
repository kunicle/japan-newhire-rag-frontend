import type { OrganizationDepartmentNode } from './types'

export interface FlatDepartment {
  departmentId: number
  departmentCode: string
  departmentName: string
  depth: number
}

export interface FlatEmployee {
  employeeId: number
  employeeName: string
  departmentId: number
  departmentName: string
  jobGradeId: number | null
  jobGradeName: string | null
}

export function flattenDepartments(
  nodes: OrganizationDepartmentNode[],
): FlatDepartment[] {
  const result: FlatDepartment[] = []
  const seen = new Set<number>()

  function visit(items: OrganizationDepartmentNode[], depth: number) {
    for (const node of items) {
      if (seen.has(node.departmentId)) continue
      seen.add(node.departmentId)
      result.push({
        departmentId: node.departmentId,
        departmentCode: node.departmentCode,
        departmentName: node.departmentName,
        depth,
      })
      visit(node.children, depth + 1)
    }
  }

  visit(nodes, 0)
  return result
}

export function flattenEmployees(
  nodes: OrganizationDepartmentNode[],
): FlatEmployee[] {
  const result: FlatEmployee[] = []

  function visit(items: OrganizationDepartmentNode[]) {
    for (const node of items) {
      for (const employee of node.employees) {
        result.push({
          employeeId: employee.employeeId,
          employeeName: employee.employeeName,
          departmentId: node.departmentId,
          departmentName: node.departmentName,
          jobGradeId: employee.jobGradeId,
          jobGradeName: employee.jobGradeName,
        })
      }
      visit(node.children)
    }
  }

  visit(nodes)
  return result
}
