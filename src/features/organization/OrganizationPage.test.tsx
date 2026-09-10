import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OrganizationPage } from './OrganizationPage'
import { AppError } from '../../shared/api/errors'
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
    expect(container.textContent).not.toContain('조직 편집')
    expect(container.querySelector('dialog')).toBeNull()
    expect(container.textContent).toContain('김부장')
    expect(container.textContent).not.toContain('PRIVATE-')
    expect(container.textContent).not.toContain('사번')
    expect(container.querySelectorAll('svg path')).toHaveLength(1)
  })
  it('allows HR to remove a manager and refreshes the chart after saving', async () => {
    mocks.roles = ['HR_MANAGER']
    await render()
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
    await render(); await click('조직 편집'); await click('이사원 조직정보 편집')
    await act(async () => { container.querySelector('dialog form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) })
    expect(container.querySelector('dialog [role="alert"]')?.textContent).toContain('순환')
    expect(mocks.fetchOrganization).toHaveBeenCalledTimes(1)
    expect(container.textContent).not.toContain('조직 정보를 저장했습니다.')
  })
  it('excludes lower grades and self from the senior employee manager selector', async () => {
    mocks.roles = ['HR_MANAGER']
    await render(); await click('조직 편집'); await click('김부장 조직정보 편집')
    expect(container.querySelector('dialog')!.querySelectorAll('select')[2].options).toHaveLength(1)
  })
  it('shows department creation only in HR edit mode', async () => {
    mocks.roles = ['HR_MANAGER']
    await render(); await click('조직 편집'); await click('부서 생성')
    expect(container.querySelector('dialog')?.textContent).toContain('부서 코드')
    await click('취소')
    expect(mocks.createDepartment).not.toHaveBeenCalled()
  })
})
