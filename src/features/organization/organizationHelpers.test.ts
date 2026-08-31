import { describe, expect, it } from 'vitest'
import { flattenDepartments } from './organizationHelpers'
import type { OrganizationDepartmentNode } from './types'

function department(
  id: number,
  name: string,
  children: OrganizationDepartmentNode[] = [],
): OrganizationDepartmentNode {
  return {
    departmentId: id,
    departmentCode: `D${id}`,
    departmentName: name,
    parentDepartmentId: null,
    displayOrder: id,
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
