import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HeadquartersChart } from './HeadquartersChart'
import { buildOrganizationChart } from './organizationChart'
import type { OrganizationDepartmentNode } from './types'
import type { OrganizationViewEmployee } from './organizationViewHelpers'

function employee(id: number, departmentId: number, level: number, managerEmployeeId: number | null): OrganizationViewEmployee {
  return { employeeId: id, employeeNumber: String(id), employeeName: '직원 ' + id, departmentId,
    departmentName: '팀 ' + departmentId, jobGradeId: level, jobGradeName: '직급 ' + level,
    jobGradeLevel: level, managerEmployeeId, hireDate: '2024-03-04' }
}

const department: OrganizationDepartmentNode = {
  departmentId: 0, departmentCode: 'HQ', departmentName: '개발본부', parentDepartmentId: null, displayOrder: 0, employees: [],
  children: [1, 2, 3].map(id => ({
    departmentId: id, departmentCode: String(id), departmentName: '팀 ' + id,
    parentDepartmentId: 0, displayOrder: id, employees: [], children: [],
  })),
}

describe('HeadquartersChart', () => {
  it.each(['개발본부', '플랫폼본부', '프로덕트본부', '경영지원본부'])('preserves reporting groups in %s without splitting cross-team relations', () => {
    const employees = [
      employee(1, 1, 3, null), employee(2, 2, 1, 1), employee(3, 3, 4, 1),
      employee(4, 2, 4, 2), employee(5, 3, 4, null), employee(6, 3, 4, 999),
      employee(4, 2, 4, 2),
    ]
    const chart = buildOrganizationChart(employees)
    const container = document.createElement('div')
    container.innerHTML = renderToStaticMarkup(<HeadquartersChart department={department} chart={chart} editing busy={false} onEdit={() => {}} />)
    const cards = [...container.querySelectorAll('[data-employee-id]')]
    expect(cards.map(card => Number(card.getAttribute('data-employee-id')))).toEqual([1, 2, 4, 3, 5, 6])
    expect(cards).toHaveLength(6)
    expect(container.querySelectorAll('[data-team-id]')).toHaveLength(3)
    expect([...container.querySelectorAll('section header span')].map(node => node.textContent)).toEqual(['1명', '2명', '3명'])
    expect(container.textContent).not.toContain('보고 체계')
    expect(container.textContent).not.toContain('리스트형')
    expect(container.querySelectorAll('img')).toHaveLength(0)
    for (const edge of chart.edges) {
      const card = container.querySelector('[data-employee-id="' + edge.to.employee.employeeId + '"]')!
      expect(card.parentElement?.getAttribute('data-manager-id')).toBe(String(edge.from.employee.employeeId))
      if (edge.from.employee.departmentId === edge.to.employee.departmentId) {
        expect(card.closest('ul[aria-label]')?.getAttribute('aria-label')).toBe(edge.from.employee.employeeName + '의 직속 부하')
      } else {
        expect(card.getAttribute('title')).toBe('직속 관리자: ' + edge.from.employee.employeeName)
      }
      expect(card.closest('[data-team-id]')?.getAttribute('data-team-id')).toBe(String(edge.to.employee.departmentId))
    }
    for (const id of [1, 5, 6]) {
      expect(container.querySelector('[data-employee-id="' + id + '"]')?.parentElement?.hasAttribute('data-manager-id')).toBe(false)
    }
    expect(container.querySelectorAll('button')).toHaveLength(6)
    expect(container.querySelectorAll('time')).toHaveLength(6)
  })

  it('places the highest-ranked actual root above real teams and keeps all headquarters members once', () => {
    const employees = [employee(10, 0, 2, null), employee(11, 0, 1, null),
      employee(12, 0, 1, 10), employee(20, 1, 2, 11), employee(21, 1, 4, 20), employee(30, 2, 4, null)]
    const container = document.createElement('div')
    container.innerHTML = renderToStaticMarkup(<HeadquartersChart department={department} chart={buildOrganizationChart(employees)} editing={false} busy={false} onEdit={() => {}} />)
    const top = container.querySelector('[aria-label="본부 상단 관리자"]')!
    expect(top.querySelector('[data-employee-id]')?.getAttribute('data-employee-id')).toBe('11')
    expect(top.querySelectorAll('[data-employee-id]')).toHaveLength(3)
    expect(container.querySelector('[data-team-id="0"]')).toBeNull()
    expect([...container.querySelectorAll('[data-team-id]')].map(node => node.getAttribute('data-team-id'))).toEqual(['1', '2', '3'])
    expect(container.querySelector('[data-team-id="1"]')?.getAttribute('data-linked-to-leader')).toBe('true')
    expect(container.querySelector('[data-team-id="2"]')?.hasAttribute('data-linked-to-leader')).toBe(false)
    expect(container.querySelector('[data-employee-id="12"]')?.parentElement?.getAttribute('data-manager-id')).toBe('10')
    expect(container.querySelectorAll('[data-employee-id]')).toHaveLength(6)
    expect(container.querySelectorAll('[data-manager-id]')).toHaveLength(3)
  })

  it('uses the same compact cards for a single team without promoting a non-root by grade', () => {
    const chart = buildOrganizationChart([employee(1, 1, 3, null), employee(2, 1, 1, 1)])
    const container = document.createElement('div')
    container.innerHTML = renderToStaticMarkup(<HeadquartersChart department={department.children[0]} chart={chart} editing={false} busy={false} onEdit={() => {}} />)
    expect(container.querySelector('[aria-label="직원 상세 조직도"]')).not.toBeNull()
    expect(container.querySelector('[data-employee-id]')?.getAttribute('data-employee-id')).toBe('1')
    expect(container.querySelector('[data-employee-id="2"]')?.closest('ul[aria-label]')?.getAttribute('aria-label')).toBe('직원 1의 직속 부하')
    expect(container.querySelector('[data-team-id]')).toBeNull()
  })
  it('retains all members of a large reporting group and hides edit actions outside editing', () => {
    const employees = [employee(1, 1, 1, null), ...Array.from({ length: 100 }, (_, index) => employee(index + 2, 2, 4, 1))]
    const container = document.createElement('div')
    container.innerHTML = renderToStaticMarkup(<HeadquartersChart department={department} chart={buildOrganizationChart(employees)} editing={false} busy={false} onEdit={() => {}} />)
    expect(container.querySelectorAll('[data-employee-id]')).toHaveLength(101)
    expect(container.querySelectorAll('[data-manager-id="1"]')).toHaveLength(100)
    expect(container.querySelectorAll('button')).toHaveLength(0)
  })
})