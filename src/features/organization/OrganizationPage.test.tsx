import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OrganizationPage } from './OrganizationPage'
import { AppError } from '../../shared/api/errors'
import type { OrganizationDepartmentNode } from './types'
import type { RoleType } from '../auth/types'

const mocks = vi.hoisted(() => ({
  roles: ['EMPLOYEE'] as RoleType[],
  fetchOrganization: vi.fn(), fetchJobGrades: vi.fn(), updateEmployeeOrganization: vi.fn(),
  createDepartment: vi.fn(), updateDepartment: vi.fn(),
}))
vi.mock('../auth/AuthContext', () => ({ useCurrentRoles: () => ({ roles: mocks.roles }) }))
vi.mock('./organizationApi', () => mocks)
;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const employee = (id: number, name: string, level: number, managerEmployeeId: number | null) => ({
  employeeId: id, employeeNumber: 'PRIVATE-NUMBER-' + id, employeeName: name, departmentId: 1,
  jobGradeId: level, jobGradeName: level === 1 ? '부장' : '신입사원', jobGradeLevel: level,
  hireDate: '2024-03-04', managerEmployeeId,
})
describe('OrganizationPage', () => {
  let container: HTMLDivElement
  let root: Root
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.roles = ['EMPLOYEE']
    mocks.fetchOrganization.mockResolvedValue({ departments: [{
      departmentId: 1, departmentCode: 'PRIVATE-CODE', departmentName: '개발부', parentDepartmentId: null,
      displayOrder: 0, children: [], employees: [employee(1, '김부장', 1, null), employee(2, '이사원', 5, 1)],
    }] })
    mocks.fetchJobGrades.mockResolvedValue([{ jobGradeId: 1, jobGradeName: '부장', jobGradeLevel: 1 }, { jobGradeId: 5, jobGradeName: '신입사원', jobGradeLevel: 5 }])
    mocks.updateEmployeeOrganization.mockResolvedValue(undefined)
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.open = true } })
    Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value() { this.open = false } })
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })
  afterEach(async () => { await act(async () => root.unmount()); container.remove() })
  async function render() { await act(async () => root.render(<OrganizationPage />)) }
  async function click(label: string) {
    const button = [...container.querySelectorAll('button')].find(value => value.textContent === label || value.getAttribute('aria-label') === label)
    expect(button).toBeDefined()
    await act(async () => button!.click())
  }
  it.each(['EMPLOYEE', 'MANAGER', 'SYSTEM_ADMIN'] as RoleType[])('hides every edit control from %s', async role => {
    mocks.roles = [role]
    await render()
    await click('개발부')
    expect(container.textContent).not.toContain('조직 편집')
    expect(container.querySelector('dialog')).toBeNull()
    expect(container.textContent).toContain('김부장')
    expect(container.textContent).not.toContain('PRIVATE-')
    expect(container.textContent).not.toContain('사번')
    expect(container.querySelectorAll('[data-manager-id]')).toHaveLength(1)
  })
  it('allows HR to remove a manager and refreshes the chart after saving', async () => {
    mocks.roles = ['HR_MANAGER']
    await render()
    await click('개발부')
    await click('조직 편집')
    await click('이사원 조직정보 편집')
    const dialog = container.querySelector('dialog')!
    expect(dialog.textContent).toContain('직원 조직정보 수정')
    const selects = dialog.querySelectorAll('select')
    const managerSelect = selects[2]
    expect([...managerSelect.options].map(value => value.text)).not.toContain('이사원 · 개발부 · 신입사원')
    await act(async () => { managerSelect.value = ''; managerSelect.dispatchEvent(new Event('change', { bubbles: true })) })
    await act(async () => { dialog.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) })
    expect(mocks.updateEmployeeOrganization).toHaveBeenCalledWith(2, { departmentId: 1, jobGradeId: 5, managerEmployeeId: null })
    expect(mocks.fetchOrganization).toHaveBeenCalledTimes(2)
    expect(container.querySelector('dialog')).toBeNull()
  })
  it('keeps failed edits open and does not claim success', async () => {
    mocks.roles = ['HR_MANAGER']
    mocks.updateEmployeeOrganization.mockRejectedValueOnce(new AppError(409, 'MANAGER_CYCLE_NOT_ALLOWED', 'Conflict'))
    await render(); await click('개발부'); await click('조직 편집'); await click('이사원 조직정보 편집')
    await act(async () => { container.querySelector('dialog form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) })
    expect(container.querySelector('dialog [role="alert"]')?.textContent).toContain('순환')
    expect(mocks.fetchOrganization).toHaveBeenCalledTimes(1)
    expect(container.textContent).not.toContain('조직 정보를 저장했습니다.')
  })
  it('excludes lower grades and self from the senior employee manager selector', async () => {
    mocks.roles = ['HR_MANAGER']
    await render(); await click('개발부'); await click('조직 편집'); await click('김부장 조직정보 편집')
    expect(container.querySelector('dialog')!.querySelectorAll('select')[2].options).toHaveLength(1)
  })
  it('keeps headquarters visible but disabled only in employee editing and preserves the saved affiliation', async () => {
    mocks.roles = ['HR_MANAGER']
    mocks.fetchOrganization.mockResolvedValue({ departments: [{
      departmentId: 1, departmentCode: 'DEV', departmentName: '개발본부', parentDepartmentId: null,
      displayOrder: 0, employees: [employee(1, '김부장', 1, null), employee(2, '이사원', 5, 1)],
      children: [{
        departmentId: 2, departmentCode: 'BACKEND', departmentName: '백엔드개발팀', parentDepartmentId: 1,
        displayOrder: 0, children: [], employees: [],
      }, {
        departmentId: 3, departmentCode: 'FRONTEND', departmentName: '프론트엔드개발팀', parentDepartmentId: 1,
        displayOrder: 1, children: [], employees: [],
      }],
    }, {
      departmentId: 4, departmentCode: 'PLATFORM', departmentName: '플랫폼본부', parentDepartmentId: null,
      displayOrder: 1, children: [], employees: [],
    }] })
    await render()
    const chartOptions = [...container.querySelectorAll('nav > ul > li > button')]
    expect(chartOptions.map(option => option.textContent)).toEqual(['전체', '개발본부', '플랫폼본부'])
    expect(chartOptions[0].getAttribute('aria-current')).toBe('true')
    await click('개발본부'); await click('조직 편집'); await click('이사원 조직정보 편집')
    let dialog = container.querySelector('dialog')!
    const departmentSelect = dialog.querySelector('select')!
    expect([...departmentSelect.options].map(option => [option.text, option.disabled])).toEqual([
      ['개발본부', true], ['　백엔드개발팀', false], ['　프론트엔드개발팀', false], ['플랫폼본부', true],
    ])
    expect(departmentSelect.value).toBe('1')
    expect(dialog.querySelector('[role="alert"]')).toBeNull()
    expect(mocks.updateEmployeeOrganization).not.toHaveBeenCalled()
    await click('취소')
    expect(mocks.updateEmployeeOrganization).not.toHaveBeenCalled()

    await click('부서 생성')
    dialog = container.querySelector('dialog')!
    expect([...dialog.querySelector('select')!.options].find(option => option.value === '1')?.disabled).toBe(false)
    await click('취소')
    await click('이사원 조직정보 편집')
    dialog = container.querySelector('dialog')!
    const [department, grade, manager] = dialog.querySelectorAll('select')
    await act(async () => {
      department.value = '2'; department.dispatchEvent(new Event('change', { bubbles: true }))
      grade.value = '1'; grade.dispatchEvent(new Event('change', { bubbles: true }))
      manager.value = ''; manager.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await act(async () => { dialog.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) })
    expect(mocks.updateEmployeeOrganization).toHaveBeenCalledWith(2, { departmentId: 2, jobGradeId: 1, managerEmployeeId: null })
    expect(container.querySelector('dialog')).toBeNull()
  })
  it('filters headquarters recursively, preserves search ancestors, and edits nested departments', async () => {
    const department = (id: number, name: string, parent: number | null, children: OrganizationDepartmentNode[] = [], employees: OrganizationDepartmentNode['employees'] = []): OrganizationDepartmentNode => ({
      departmentId: id, departmentCode: String(id), departmentName: name, parentDepartmentId: parent, displayOrder: id, children, employees,
    })
    mocks.roles = ['HR_MANAGER']
    mocks.fetchOrganization.mockResolvedValue({ departments: [
      department(1, '개발본부', null, [
        department(2, '백엔드팀', 1, [
          department(3, '하위팀', 2, [], [{ ...employee(3, '하위사원', 4, 2), departmentId: 3 }]),
        ], [{ ...employee(2, '팀관리자', 2, 1), departmentId: 2 }]),
        department(4, 'AI팀', 1, [], [{ ...employee(4, '독립사원', 4, null), departmentId: 4 }]),
      ], [employee(1, '본부장', 1, null)]),
      department(5, '플랫폼본부', null, [], [{ ...employee(5, '플랫폼직원', 1, null), departmentId: 5 }]),
    ] })
    await render()
    expect([...container.querySelectorAll('nav > ul > li > button')].map(button => button.textContent)).toEqual(['전체', '개발본부', '플랫폼본부'])
    await click('개발본부')
    expect(container.querySelector('nav [aria-current="true"]')?.textContent).toBe('개발본부')
    const names = () => [...container.querySelectorAll('h3')].map(node => node.textContent)
    expect(names()).toEqual(['본부장', '팀관리자', '하위사원', '독립사원'])
    expect(new Set(names()).size).toBe(4)
    expect(container.querySelectorAll('[data-manager-id]')).toHaveLength(2)
    const search = container.querySelector<HTMLInputElement>('input[type="search"]')!
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(search, '하위사원')
      search.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(names()).toEqual(['본부장', '팀관리자', '하위사원'])
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(search, '')
      search.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await click('전체')
    expect(names()).toEqual([])
    await click('조직 편집')
    const editSelect = container.querySelector<HTMLSelectElement>('select')!
    await act(async () => { editSelect.value = '3'; editSelect.dispatchEvent(new Event('change', { bubbles: true })) })
    expect(container.querySelector('dialog h2')?.textContent).toBe('부서 정보 수정')
    expect(container.querySelector<HTMLInputElement>('dialog input')?.value).toBe('하위팀')
    await click('저장')
    expect(mocks.updateDepartment).toHaveBeenCalledWith(3, { departmentName: '하위팀', parentDepartmentId: 2 })
  })
  it('expands and collapses headquarters and limits team selection and search to that team', async () => {
    const team: OrganizationDepartmentNode = {
      departmentId: 2, departmentCode: 'TEAM', departmentName: '프론트엔드개발팀', parentDepartmentId: 1,
      displayOrder: 0, children: [], employees: [
        { ...employee(2, '팀관리자', 3, 1), departmentId: 2 },
        { ...employee(3, '팀사원', 1, 2), departmentId: 2 },
        { ...employee(4, '독립사원', 4, null), departmentId: 2 },
      ],
    }
    mocks.fetchOrganization.mockResolvedValue({ departments: [{
      departmentId: 1, departmentCode: 'HQ', departmentName: '개발본부', parentDepartmentId: null,
      displayOrder: 0, employees: [employee(1, '본부장', 1, null)], children: [team, {
        ...team, departmentId: 3, departmentName: '백엔드개발팀',
        employees: [{ ...employee(5, '다른팀사원', 4, 1), departmentId: 3 }],
      }],
    }] })
    await render()
    const names = () => [...container.querySelectorAll('h3')].map(node => node.textContent)
    const headquarters = container.querySelector<HTMLButtonElement>('nav button[aria-expanded]')!
    const teams = document.getElementById(headquarters.getAttribute('aria-controls')!)!
    expect(container.querySelector('section[aria-label="직속 상급자 조직도"] h2')?.textContent).toBe('전체 조직도')
    expect(names()).toEqual([])
    expect(teams.hidden).toBe(true)
    await click('개발본부')
    expect(headquarters.getAttribute('aria-expanded')).toBe('true')
    expect(headquarters.getAttribute('aria-current')).toBe('true')
    expect(teams.hidden).toBe(false)
    expect(names()).toHaveLength(5)
    await click('개발본부')
    expect(teams.hidden).toBe(true)
    expect(headquarters.getAttribute('aria-expanded')).toBe('false')
    await click('개발본부')
    await click('프론트엔드개발팀')
    expect(container.querySelector('nav [aria-current="true"]')?.textContent).toBe('프론트엔드개발팀')
    expect(container.querySelector('section[aria-label="직속 상급자 조직도"] h2')?.textContent).toBe('프론트엔드개발팀')
    expect(names()).toEqual(['팀관리자', '팀사원', '독립사원'])
    expect(new Set(names()).size).toBe(3)
    expect(container.querySelectorAll('[data-manager-id]')).toHaveLength(1)
    expect(container.querySelector('[data-employee-id="3"]')?.parentElement?.getAttribute('data-manager-id')).toBe('2')
    expect(container.querySelector('[aria-label="직원 상세 조직도"]')).not.toBeNull()
    expect(container.textContent).toContain('3명의 구성원')
    const search = container.querySelector<HTMLInputElement>('input[type="search"]')!
    async function searchName(value: string) {
      await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(search, value)
        search.dispatchEvent(new Event('input', { bubbles: true }))
      })
    }
    await searchName('팀사원')
    expect(names()).toEqual(['팀관리자', '팀사원'])
    await searchName('다른팀사원')
    expect(names()).toEqual([])
    await searchName('')
    await click('전체')
    expect(names()).toEqual([])
  })
  it('summarizes 101 employees in four headquarters and nine teams, and opens details and search editing', async () => {
    mocks.roles = ['HR_MANAGER']
    const groups = [
      ['개발본부', '프론트엔드개발팀', '백엔드개발팀', 'AI개발팀'],
      ['플랫폼본부', '인프라플랫폼팀', '정보보안팀', 'QA팀'],
      ['프로덕트본부', '서비스기획팀', 'UX/UI디자인팀'],
      ['경영지원본부', '인사팀'],
    ]
    let teamIndex = 0
    const departments: OrganizationDepartmentNode[] = groups.map(([name, ...teams], index) => ({
      departmentId: 1000 + index, departmentCode: String(index), departmentName: name, parentDepartmentId: null,
      displayOrder: index, employees: index === 0 ? [{ ...employee(999, '기존본부직원', 1, null), departmentId: 1000 }] : [],
      children: teams.map(teamName => {
        const id = teamIndex++
        const members = Array.from({ length: 100 }, (_, employeeIndex) => employeeIndex)
          .filter(employeeIndex => employeeIndex % 9 === id)
          .map(employeeIndex => ({ ...employee(employeeIndex, '사원 ' + employeeIndex, 5, null), departmentId: id }))
        return {
          departmentId: id, departmentCode: 'TEAM' + id, departmentName: teamName, parentDepartmentId: 1000 + index,
          displayOrder: id, employees: id === 0 ? [...members, members[0]] : members, children: [],
        }
      }),
    }))
    mocks.fetchOrganization.mockResolvedValue({ departments })
    await render()
    const summary = () => container.querySelector('[aria-label="회사 조직 요약"]')!
    expect(container.textContent).toContain('101명의 구성원 · 13개 부서')
    expect(summary().querySelectorAll(':scope > ul > li')).toHaveLength(4)
    expect(summary().querySelectorAll('button')).toHaveLength(13)
    expect(summary().textContent).toContain('35명')
    expect(summary().textContent).toContain('12명')
    for (const [index, branch] of [...summary().querySelectorAll(':scope > ul > li')].entries()) {
      expect([...branch.querySelectorAll('strong')].map(node => node.textContent)).toEqual(groups[index])
    }
    expect(container.querySelectorAll('h3')).toHaveLength(0)
    expect(summary().textContent).not.toContain('사원 0')
    async function summaryClick(name: string) {
      const button = [...summary().querySelectorAll('button')].find(value => value.querySelector('strong')?.textContent === name)!
      await act(async () => button.click())
    }
    await summaryClick('개발본부')
    expect(container.querySelectorAll('h3')).toHaveLength(35)
    expect(container.textContent).toContain('기존본부직원')
    expect(container.querySelector('nav [aria-current="true"]')?.textContent).toBe('개발본부')
    await click('전체')
    await summaryClick('프론트엔드개발팀')
    expect(container.querySelectorAll('h3')).toHaveLength(12)
    expect(container.querySelector('nav [aria-current="true"]')?.textContent).toBe('프론트엔드개발팀')
    await click('전체')
    await click('조직 편집')
    expect(summary()).not.toBeNull()
    const input = container.querySelector<HTMLInputElement>('input[type="search"]')!
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, '사원 0')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(container.querySelector('[aria-label="회사 조직 요약"]')).toBeNull()
    expect([...container.querySelectorAll('h3')].map(node => node.textContent)).toEqual(['사원 0'])
    await click('사원 0 조직정보 편집')
    expect(container.querySelector('dialog')?.textContent).toContain('직원 조직정보 수정')
    await click('취소')
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, '')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(summary().querySelectorAll('button')).toHaveLength(13)
  })
  it('shows department creation only in HR edit mode', async () => {
    mocks.roles = ['HR_MANAGER']
    await render(); await click('개발부'); await click('조직 편집'); await click('부서 생성')
    expect(container.querySelector('dialog')?.textContent).toContain('부서 코드')
    await click('취소')
    expect(mocks.createDepartment).not.toHaveBeenCalled()
  })
})
