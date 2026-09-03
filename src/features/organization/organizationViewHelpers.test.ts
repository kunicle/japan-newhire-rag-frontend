import { describe, expect, it } from 'vitest'
import type { OrganizationDepartmentNode, OrganizationEmployee } from './types'
import { countEmployeesByDepartment, filterEmployeesByName, flattenOrganizationViewEmployees, organizationDisplayLabel } from './organizationViewHelpers'

function employee(employeeId: number, employeeNumber: string, employeeName: string, departmentId: number): OrganizationEmployee { return { employeeId, employeeNumber, employeeName, departmentId, jobGradeId: null, jobGradeName: null, jobGradeLevel: null, hireDate: `2024-01-0${employeeId}` } }
function department(departmentId: number, departmentName: string, employees: OrganizationEmployee[], children: OrganizationDepartmentNode[] = []): OrganizationDepartmentNode { return { departmentId, departmentCode: `D${departmentId}`, departmentName, parentDepartmentId: null, displayOrder: departmentId, employees, children } }

describe('organization view helpers', () => {
  const nested = [department(1, '본사', [employee(1, 'E002', 'Bravo', 1), employee(2, 'E001', 'Alpha', 1)], [department(2, '인사팀', [employee(3, 'E003', 'Charlie', 2)])]), department(3, '연구소', [employee(4, 'E004', 'Delta', 3)])]
  it('flattens nested employees in backend order and joins department data', () => { const result = flattenOrganizationViewEmployees(nested); expect(result.map((entry) => entry.employeeName)).toEqual(['Bravo', 'Alpha', 'Charlie', 'Delta']); expect(result[2]).toMatchObject({ departmentName: '인사팀', employeeNumber: 'E003', hireDate: '2024-01-03' }) })
  it('flattens an empty tree', () => expect(flattenOrganizationViewEmployees([])).toEqual([]))
  it('returns the original list for empty and whitespace queries', () => { const employees = flattenOrganizationViewEmployees(nested); expect(filterEmployeesByName(employees, '')).toBe(employees); expect(filterEmployeesByName(employees, '   ')).toBe(employees) })
  it('filters names case-insensitively', () => expect(filterEmployeesByName(flattenOrganizationViewEmployees(nested), 'ALP').map((entry) => entry.employeeName)).toEqual(['Alpha']))
  it('returns no name matches', () => expect(filterEmployeesByName(flattenOrganizationViewEmployees(nested), 'nobody')).toEqual([]))
  it('filters an empty employee list', () => expect(filterEmployeesByName([], 'name')).toEqual([]))
  it('counts direct employees by department', () => expect([...countEmployeesByDepartment(flattenOrganizationViewEmployees(nested))]).toEqual([[1, 2], [2, 1], [3, 1]]))
  it('counts an empty list', () => expect(countEmployeesByDepartment([]).size).toBe(0))
  it('localizes only known development placeholder labels', () => {
    expect(organizationDisplayLabel('Development Default Department')).toBe('개발 기본 부서')
    expect(organizationDisplayLabel('Development Default Grade')).toBe('개발 기본 직급')
    expect(organizationDisplayLabel('Engineering')).toBe('Engineering')
  })
})
