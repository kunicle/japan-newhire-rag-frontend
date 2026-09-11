import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OnboardingManagementPage } from './OnboardingManagementPage'

const apiMock = vi.hoisted(() => ({
  assignManagedOnboardingTask: vi.fn(),
  completeManagedOnboarding: vi.fn(),
  fetchManagedOnboardingProgress: vi.fn(),
  fetchManagedOnboardingTasks: vi.fn(),
  startManagedOnboarding: vi.fn(),
}))
const organizationApiMock = vi.hoisted(() => ({
  fetchOrganization: vi.fn(),
}))
const authMock = vi.hoisted(() => ({
  useAuth: vi.fn(),
}))

vi.mock('./onboardingManagementApi', () => apiMock)
vi.mock('../organization/organizationApi', () => organizationApiMock)
vi.mock('../auth/AuthContext', () => authMock)

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true

const progressItem = {
  employeeId: 101,
  employeeName: '김신입',
  employeeDepartmentId: 10,
  employeeDepartmentName: '개발팀',
  onboardingAssignmentId: 20,
  onboardingTaskId: 30,
  taskDepartmentId: 10,
  taskTitle: '개발 환경 설정',
  taskDescription: '개발 도구를 설치합니다.',
  assignedDate: '2026-09-11',
  dueDate: '2026-09-12',
  assignmentStatus: 'ASSIGNED',
  completionStatus: 'NOT_STARTED',
  completionNote: null,
  completedAt: null,
  overdue: false,
} as const

const progressPage = {
  content: [progressItem],
  page: 0,
  size: 20,
  totalElements: 1,
  totalPages: 1,
  first: true,
  last: true,
}

describe('OnboardingManagementPage', () => {
  let container: HTMLDivElement
  let root: Root | null

  beforeEach(() => {
    Object.values(apiMock).forEach((mock) => mock.mockReset())
    organizationApiMock.fetchOrganization.mockReset()
    authMock.useAuth.mockReset()
    authMock.useAuth.mockReturnValue({
      user: {
        employeeId: 200,
        roles: ['MANAGER'],
      },
      roles: ['MANAGER'],
    })
    apiMock.fetchManagedOnboardingProgress.mockResolvedValue(progressPage)
    apiMock.fetchManagedOnboardingTasks.mockResolvedValue({
      content: [{
        taskId: 30,
        departmentId: 10,
        taskTitle: '개발 환경 설정',
        taskDescription: '개발 도구를 설치합니다.',
        defaultDueDays: 1,
        active: true,
        createdBy: 1,
        createdAt: '2026-09-11T00:00:00',
        updatedAt: '2026-09-11T00:00:00',
      }],
      page: 0,
      size: 100,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    })
    organizationApiMock.fetchOrganization.mockResolvedValue({
      departments: [{
        departmentId: 10,
        departmentCode: 'DEV',
        departmentName: '개발팀',
        parentDepartmentId: null,
        displayOrder: 1,
        employees: [{
          employeeId: 101,
          employeeNumber: 'N001',
          employeeName: '김신입',
          departmentId: 10,
          jobGradeId: null,
          jobGradeName: null,
          jobGradeLevel: null,
          hireDate: '2026-09-01',
          managerEmployeeId: 200,
        }],
        children: [],
      }],
    })
    root = null
    container = document.createElement('div')
    document.body.append(container)
  })

  afterEach(async () => {
    if (root) await act(async () => root?.unmount())
    container.remove()
  })

  async function renderPage() {
    root = createRoot(container)
    await act(async () => root?.render(<OnboardingManagementPage />))
  }

  function changeSelect(select: HTMLSelectElement, value: string) {
    Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      'value',
    )?.set?.call(select, value)
    select.dispatchEvent(new Event('change', { bubbles: true }))
  }

  it('loads scoped progress and manager assignment choices', async () => {
    await renderPage()

    expect(apiMock.fetchManagedOnboardingProgress)
      .toHaveBeenCalledWith(0, 20)
    expect(apiMock.fetchManagedOnboardingTasks)
      .toHaveBeenCalledWith(0, 100)
    expect(container.textContent).toContain('김신입 · 개발팀')
    expect(container.textContent).toContain('개발 환경 설정')
  })

  it('assigns the selected task to a direct report', async () => {
    apiMock.assignManagedOnboardingTask.mockResolvedValue({
      onboardingTaskId: 30,
      requestedCount: 1,
      successCount: 1,
      duplicateCount: 0,
    })
    await renderPage()

    const selects = container.querySelectorAll('select')
    await act(async () => {
      changeSelect(selects[0] as HTMLSelectElement, '30')
      changeSelect(selects[1] as HTMLSelectElement, '101')
    })
    const assignButton = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === '부여')
    await act(async () => assignButton?.click())

    expect(apiMock.assignManagedOnboardingTask)
      .toHaveBeenCalledWith(30, [101])
    expect(container.textContent).toContain('오늘 할 일을 부여했습니다.')
  })

  it('moves a not-started assignment forward', async () => {
    apiMock.startManagedOnboarding.mockResolvedValue({
      ...progressItem,
      completionStatus: 'IN_PROGRESS',
    })
    await renderPage()

    const startButton = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('진행 중으로 변경'))
    await act(async () => startButton?.click())

    expect(apiMock.startManagedOnboarding).toHaveBeenCalledWith(20)
    expect(apiMock.fetchManagedOnboardingProgress)
      .toHaveBeenCalledTimes(2)
  })
})
