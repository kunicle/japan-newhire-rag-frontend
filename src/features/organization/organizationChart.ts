import type { OrganizationViewEmployee } from './organizationViewHelpers'

export const CARD_WIDTH = 160
export const CARD_HEIGHT = 144
const COLUMN_GAP = 16
export const ROW_GAP = 36

export interface ChartNode {
  employee: OrganizationViewEmployee
  x: number
  y: number
}
export interface ChartEdge { from: ChartNode; to: ChartNode }
export interface OrganizationChart {
  nodes: ChartNode[]
  edges: ChartEdge[]
  width: number
  height: number
  hasCycle: boolean
}

// Smaller grade_level means higher seniority (confirmed HR policy).
export function compareEmployees(a: OrganizationViewEmployee, b: OrganizationViewEmployee): number {
  return (a.jobGradeLevel ?? Number.MAX_SAFE_INTEGER) - (b.jobGradeLevel ?? Number.MAX_SAFE_INTEGER)
    || a.employeeName.localeCompare(b.employeeName, 'ko') || a.employeeId - b.employeeId
}

export function wouldCreateManagerCycle(employees: OrganizationViewEmployee[], employeeId: number, managerId: number): boolean {
  const byId = new Map(employees.map(employee => [employee.employeeId, employee]))
  const seen = new Set<number>()
  let cursor: number | null | undefined = managerId
  while (cursor != null) {
    if (cursor === employeeId || seen.has(cursor)) return true
    seen.add(cursor)
    cursor = byId.get(cursor)?.managerEmployeeId
  }
  return false
}

// Keep real ancestors inside the selected scope, without inventing replacement reporting lines.
export function filterChartEmployees(employees: OrganizationViewEmployee[], departmentId: number | ReadonlySet<number> | null, query: string): OrganizationViewEmployee[] {
  const scoped = employees.filter(employee => departmentId == null
    || (typeof departmentId === 'number' ? employee.departmentId === departmentId : departmentId.has(employee.departmentId)))
  const byId = new Map(scoped.map(employee => [employee.employeeId, employee]))
  const selected = new Set<number>()
  const search = query.trim().toLocaleLowerCase()
  for (const employee of scoped) {
    if (search && !employee.employeeName.toLocaleLowerCase().includes(search)) continue
    let cursor: OrganizationViewEmployee | undefined = employee
    while (cursor && !selected.has(cursor.employeeId)) {
      selected.add(cursor.employeeId)
      cursor = cursor.managerEmployeeId == null ? undefined : byId.get(cursor.managerEmployeeId)
    }
  }
  return scoped.filter(employee => selected.has(employee.employeeId))
}

export function buildOrganizationChart(employees: OrganizationViewEmployee[]): OrganizationChart {
  const unique = [...new Map(employees.map(employee => [employee.employeeId, employee])).values()].sort(compareEmployees)
  const byId = new Map(unique.map(employee => [employee.employeeId, employee]))
  const parent = new Map<number, number>()
  let hasCycle = false
  for (const employee of unique) {
    const manager = employee.managerEmployeeId
    if (manager == null || !byId.has(manager)) continue
    const seen = new Set([employee.employeeId])
    let cursor: number | undefined = manager
    while (cursor !== undefined && !seen.has(cursor)) {
      seen.add(cursor)
      cursor = parent.get(cursor)
    }
    if (cursor !== undefined) { hasCycle = true; continue }
    parent.set(employee.employeeId, manager)
  }
  const children = new Map<number, OrganizationViewEmployee[]>()
  for (const employee of unique) {
    const manager = parent.get(employee.employeeId)
    if (manager == null) continue
    const siblings = children.get(manager) ?? []
    siblings.push(employee)
    children.set(manager, siblings)
  }
  const roots = unique.filter(employee => !parent.has(employee.employeeId))
  const widths = new Map<number, number>()
  function measure(employee: OrganizationViewEmployee): number {
    const descendants = children.get(employee.employeeId) ?? []
    const width = Math.max(CARD_WIDTH, descendants.reduce((sum, child) => sum + measure(child), 0) + Math.max(0, descendants.length - 1) * COLUMN_GAP)
    widths.set(employee.employeeId, width)
    return width
  }
  roots.forEach(measure)
  const nodes: ChartNode[] = []
  const edges: ChartEdge[] = []
  function place(employee: OrganizationViewEmployee, left: number, minimumRow: number, manager?: ChartNode) {
    const row = minimumRow
    const node = { employee, x: left + (widths.get(employee.employeeId)! - CARD_WIDTH) / 2, y: row * (CARD_HEIGHT + ROW_GAP) }
    nodes.push(node)
    if (manager) edges.push({ from: manager, to: node })
    let nextLeft = left
    for (const child of children.get(employee.employeeId) ?? []) {
      place(child, nextLeft, row + 1, node)
      nextLeft += widths.get(child.employeeId)! + COLUMN_GAP
    }
  }
  let left = 0
  for (const root of roots) {
    place(root, left, 0)
    left += widths.get(root.employeeId)! + COLUMN_GAP
  }
  return { nodes, edges, width: Math.max(CARD_WIDTH, left - COLUMN_GAP), height: nodes.reduce((max, node) => Math.max(max, node.y + CARD_HEIGHT), 0), hasCycle }
}
