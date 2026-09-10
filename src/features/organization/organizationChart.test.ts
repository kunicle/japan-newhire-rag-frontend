import { describe, expect, it } from 'vitest'
import { buildOrganizationChart, CARD_HEIGHT, CARD_WIDTH, filterChartEmployees, wouldCreateManagerCycle } from './organizationChart'
import type { OrganizationViewEmployee } from './organizationViewHelpers'

function employee(id: number, level: number, manager: number | null = null, departmentId = 1): OrganizationViewEmployee {
  return { employeeId: id, employeeNumber: 'hidden-' + id, employeeName: 'Employee ' + id, departmentId, departmentName: 'Department', jobGradeId: level, jobGradeName: 'Grade', jobGradeLevel: level, hireDate: '2024-01-01', managerEmployeeId: manager }
}
describe('organization chart', () => {
  it('sorts independent roots by grade without inventing hierarchy', () => {
    const chart = buildOrganizationChart([employee(3, 5), employee(1, 1), employee(2, 3)])
    expect(chart.nodes.map(node => node.employee.employeeId)).toEqual([1, 2, 3])
    expect(chart.nodes[0].y).toBe(0)
    expect(chart.nodes.every(node => node.y === 0)).toBe(true)
    expect(chart.edges).toHaveLength(0)
  })
  it('prioritizes real DIRECT relations even with inconsistent legacy grades and across departments', () => {
    const chart = buildOrganizationChart([employee(1, 5), employee(2, 1, 1, 2), employee(3, 5, 1)])
    expect(chart.edges).toHaveLength(2)
    const parent = chart.nodes.find(node => node.employee.employeeId === 1)!
    expect(chart.nodes.filter(node => node !== parent).every(node => node.y > parent.y)).toBe(true)
  })
  it('uses relation depth for rows and grade ASC only for sibling order', () => {
    const chart = buildOrganizationChart([employee(1, 1), employee(2, 4, 1), employee(3, 2, 1), employee(4, 3, 1), employee(5, 1, 2)])
    expect(chart.edges.map(edge => [edge.from.employee.employeeId, edge.to.employee.employeeId])).toEqual([[1, 3], [1, 4], [1, 2], [2, 5]])
    const siblings = chart.nodes.filter(node => node.employee.managerEmployeeId === 1)
    expect(new Set(siblings.map(node => node.y)).size).toBe(1)
    expect(siblings.map(node => node.employee.employeeId)).toEqual([3, 4, 2])
    expect(chart.nodes.find(node => node.employee.employeeId === 5)!.y).toBeGreaterThan(siblings[0].y)
  })
  it('retains unassigned and unavailable-manager employees once as roots', () => {
    const chart = buildOrganizationChart([employee(1, 1), employee(2, 4, 99), employee(2, 4, 99)])
    expect(chart.nodes.map(node => node.employee.employeeId)).toEqual([1, 2])
    expect(chart.nodes.every(node => node.y === 0)).toBe(true)
    expect(chart.edges).toHaveLength(0)
  })
  it('places siblings without overlapping, including large teams', () => {
    const chart = buildOrganizationChart([employee(1, 1), ...Array.from({ length: 100 }, (_, index) => employee(index + 2, 5, 1))])
    expect(chart.nodes).toHaveLength(101)
    for (let i = 0; i < chart.nodes.length; i++) for (let j = i + 1; j < chart.nodes.length; j++) {
      const a = chart.nodes[i], b = chart.nodes[j]
      expect(Math.abs(a.x - b.x) >= CARD_WIDTH || Math.abs(a.y - b.y) >= CARD_HEIGHT).toBe(true)
    }
  })
  it('breaks cyclic legacy data safely and never duplicates employees', () => {
    const chart = buildOrganizationChart([employee(1, 1, 2), employee(2, 1, 3), employee(3, 1, 1), employee(1, 1, 2)])
    expect(chart.hasCycle).toBe(true)
    expect(chart.nodes).toHaveLength(3)
    expect(chart.edges).toHaveLength(2)
  })
  it('retains ancestors across department filters and name searches', () => {
    const employees = [employee(1, 1), employee(2, 3, 1, 2), employee(3, 5, 2, 2), employee(4, 5)]
    expect(filterChartEmployees(employees, 2, 'Employee 3').map(value => value.employeeId)).toEqual([1, 2, 3])
    expect(filterChartEmployees(employees, null, 'missing')).toEqual([])
  })
  it('rejects self and indirect subordinate manager candidates', () => {
    const employees = [employee(1, 1), employee(2, 2, 1), employee(3, 3, 2)]
    expect(wouldCreateManagerCycle(employees, 1, 1)).toBe(true)
    expect(wouldCreateManagerCycle(employees, 1, 3)).toBe(true)
    expect(wouldCreateManagerCycle(employees, 3, 1)).toBe(false)
  })
})
