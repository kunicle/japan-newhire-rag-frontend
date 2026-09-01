import { describe, expect, it } from 'vitest'
import { flattenDepartments, flattenEmployees } from './organizationHelpers'
import type { OrganizationDepartmentNode, OrganizationEmployee } from './types'

function department(
  id: number,
  name: string,
  children: OrganizationDepartmentNode[] = [],
  employees: OrganizationEmployee[] = [],
): OrganizationDepartmentNode {
  return {
    departmentId: id,
    departmentCode: `D${id}`,
    departmentName: name,
    parentDepartmentId: null,
    displayOrder: id,
    employees,
    children,
  }
}

describe('flattenDepartments', () => {
  it('preserves traversal order and calculates nested depths', () => {
    const nodes = [
      department(1, 'Root', [
        department(2, 'Child', [department(3, 'Grandchild')]),
        department(4, 'Second child'),
      ]),
      department(5, 'Second root'),
    ]

    expect(flattenDepartments(nodes).map(({ departmentId, depth }) => ({
      departmentId,
      depth,
    }))).toEqual([
      { departmentId: 1, depth: 0 },
      { departmentId: 2, depth: 1 },
      { departmentId: 3, depth: 2 },
      { departmentId: 4, depth: 1 },
      { departmentId: 5, depth: 0 },
    ])
  })

  it('keeps only the first occurrence of a duplicate ID', () => {
    expect(flattenDepartments([
      department(1, 'First'),
      department(1, 'Duplicate'),
    ])).toEqual([{
      departmentId: 1,
      departmentCode: 'D1',
      departmentName: 'First',
      depth: 0,
    }])
  })

  it('returns an empty array for an empty tree', () => {
    expect(flattenDepartments([])).toEqual([])
  })
})

describe('flattenEmployees', () => {
  const employee = (
    employeeId: number,
    employeeName: string,
    departmentId: number,
    jobGradeId: number | null,
    jobGradeName: string | null,
  ): OrganizationEmployee => ({
    employeeId,
    employeeNumber: `E${employeeId}`,
    employeeName,
    departmentId,
    jobGradeId,
    jobGradeName,
    jobGradeLevel: jobGradeId,
    hireDate: '2026-01-01',
  })

  it('preserves root and nested traversal order with department names', () => {
    const nodes = [department(1, '본사', [
      department(2, '인사팀', [], [employee(2, '김인사', 2, null, null)]),
    ], [employee(1, '홍길동', 1, 3, '선임')])]

    expect(flattenEmployees(nodes)).toEqual([
      { employeeId: 1, employeeName: '홍길동', departmentId: 1,
        departmentName: '본사', jobGradeId: 3, jobGradeName: '선임' },
      { employeeId: 2, employeeName: '김인사', departmentId: 2,
        departmentName: '인사팀', jobGradeId: null, jobGradeName: null },
    ])
  })

  it('returns empty for an empty tree', () => {
    expect(flattenEmployees([])).toEqual([])
  })

  it('returns empty when departments have no employees', () => {
    expect(flattenEmployees([department(1, '본사', [department(2, '인사팀')])]))
      .toEqual([])
  })
})
