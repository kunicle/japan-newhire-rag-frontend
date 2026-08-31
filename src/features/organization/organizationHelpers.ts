import type { OrganizationDepartmentNode } from './types'

export interface FlatDepartment {
  departmentId: number
  departmentCode: string
  departmentName: string
  depth: number
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
