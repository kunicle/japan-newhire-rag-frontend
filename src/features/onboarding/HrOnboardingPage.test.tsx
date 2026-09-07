import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { OrganizationResponse } from '../organization/types'
import type { HrOnboardingTask, HrOnboardingTaskPage } from './hrOnboardingTypes'
import { HrOnboardingPage } from './HrOnboardingPage'

const onboardingApiMock = vi.hoisted(() => ({
  assignOnboardingTask: vi.fn(),
  changeOnboardingTaskActivation: vi.fn(),
  createOnboardingTask: vi.fn(),
  fetchOnboardingTasks: vi.fn(),
  updateOnboardingTask: vi.fn(),
}))

const organizationApiMock = vi.hoisted(() => ({
  fetchOrganization: vi.fn(),
}))

vi.mock('./hrOnboardingApi', () => onboardingApiMock)
vi.mock('../organization/organizationApi', () => organizationApiMock)

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true

const organization: OrganizationResponse = {
  departments: [
    {
      departmentId: 10,
      departmentCode: 'HR',
      departmentName: '인사팀',
      parentDepartmentId: null,
      displayOrder: 1,
      employees: [],
      children: [],
    },
  ],
}

const firstTask: HrOnboardingTask = {
  taskId: 1,
  departmentId: 10,
  taskTitle: '입사 서류 제출',
  taskDescription: '입사 서류를 제출합니다.',
  defaultDueDays: 3,
  active: true,
  createdBy: 100,
  createdAt: '2026-09-07T09:00:00',
  updatedAt: '2026-09-07T09:00:00',
}

const secondTask: HrOnboardingTask = {
  ...firstTask,
  taskId: 2,
  taskTitle: '보안 교육 수강',
  taskDescription: '필수 보안 교육을 수강합니다.',
  active: false,
  createdAt: '2026-09-06T09:00:00',
  updatedAt: '2026-09-06T09:00:00',
}

function taskPage(
  content: HrOnboardingTask[],
  page = 0,
  totalPages = content.length === 0 ? 0 : 1,
): HrOnboardingTaskPage {
  return {
    content,
    page,
    size: 20,
    totalElements: content.length,
    totalPages,
    first: page === 0,
    last: totalPages === 0 || page === totalPages - 1,
  }
}

describe('HrOnboardingPage', () => {
  let container: HTMLDivElement
  let root: Root | null

  beforeEach(() => {
    Object.values(onboardingApiMock).forEach((mock) => mock.mockReset())
    organizationApiMock.fetchOrganization.mockReset()
    organizationApiMock.fetchOrganization.mockResolvedValue(organization)
    onboardingApiMock.fetchOnboardingTasks.mockResolvedValue(
      taskPage([firstTask, secondTask]),
    )
    root = null
    container = document.createElement('div')
    document.body.append(container)
  })

  afterEach(async () => {
    if (root) {
      await act(async () => root?.unmount())
    }
    container.remove()
  })

  async function renderPage() {
    root = createRoot(container)
    await act(async () => {
      root?.render(<HrOnboardingPage />)
    })
  }

  function buttonWithText(text: string) {
    return [...container.querySelectorAll('button')].find((button) =>
      button.textContent?.includes(text),
    )
  }

  function changeValue(
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    value: string,
  ) {
    const prototype = element instanceof HTMLInputElement
      ? HTMLInputElement.prototype
      : element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLSelectElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(element, value)
    element.dispatchEvent(new Event('change', { bubbles: true }))
    element.dispatchEvent(new Event('input', { bubbles: true }))
  }

  it('loads the first task page when entering the page', async () => {
    await renderPage()

    expect(onboardingApiMock.fetchOnboardingTasks).toHaveBeenCalledWith(0, 20)
  })

  it('renders server tasks and automatically selects the first task', async () => {
    await renderPage()

    expect(container.textContent).toContain(firstTask.taskTitle)
    expect(container.textContent).toContain(secondTask.taskTitle)
    expect(buttonWithText(firstTask.taskTitle)?.getAttribute('aria-pressed')).toBe('true')
    expect(container.textContent).toContain(firstTask.taskDescription)
  })

  it('selects another task from the list', async () => {
    await renderPage()

    await act(async () => buttonWithText(secondTask.taskTitle)?.click())

    expect(buttonWithText(secondTask.taskTitle)?.getAttribute('aria-pressed')).toBe('true')
    expect(container.textContent).toContain(secondTask.taskDescription)
  })

  it('shows an empty state when there are no tasks', async () => {
    onboardingApiMock.fetchOnboardingTasks.mockResolvedValue(taskPage([]))

    await renderPage()

    expect(container.textContent).toContain('등록된 온보딩 태스크가 없습니다.')
    expect(container.textContent).toContain('새 온보딩 태스크 만들기')
  })

  it('shows a loading error and retries the request', async () => {
    onboardingApiMock.fetchOnboardingTasks
      .mockRejectedValueOnce(new Error('HTTP 500'))
      .mockResolvedValueOnce(taskPage([firstTask]))

    await renderPage()

    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      '온보딩 태스크 목록을 불러오지 못했습니다.',
    )

    await act(async () => buttonWithText('다시 시도')?.click())

    expect(onboardingApiMock.fetchOnboardingTasks).toHaveBeenCalledTimes(2)
    expect(container.textContent).toContain(firstTask.taskTitle)
  })

  it('loads the requested page when moving to the next page', async () => {
    onboardingApiMock.fetchOnboardingTasks
      .mockResolvedValueOnce(taskPage([firstTask], 0, 2))
      .mockResolvedValueOnce(taskPage([secondTask], 1, 2))

    await renderPage()
    await act(async () => buttonWithText('다음')?.click())

    expect(onboardingApiMock.fetchOnboardingTasks).toHaveBeenLastCalledWith(1, 20)
    expect(container.textContent).toContain('페이지 2 / 2')
    expect(buttonWithText(secondTask.taskTitle)?.getAttribute('aria-pressed')).toBe('true')
  })

  it('reloads page zero and selects the newly created task', async () => {
    const createdTask = {
      ...firstTask,
      taskId: 3,
      taskTitle: '계정 설정',
      taskDescription: '업무 계정을 설정합니다.',
    }
    onboardingApiMock.createOnboardingTask.mockResolvedValue(createdTask)
    onboardingApiMock.fetchOnboardingTasks
      .mockResolvedValueOnce(taskPage([firstTask]))
      .mockResolvedValueOnce(taskPage([createdTask, firstTask]))

    await renderPage()
    await act(async () => buttonWithText('새 태스크 만들기')?.click())

    const form = container.querySelector<HTMLFormElement>('form')
    const select = form?.querySelector<HTMLSelectElement>('select')
    const titleInput = form?.querySelector<HTMLInputElement>('input:not([type="number"])')
    const description = form?.querySelector<HTMLTextAreaElement>('textarea')
    if (!form || !select || !titleInput || !description) {
      throw new Error('Create task form was not rendered')
    }

    await act(async () => {
      changeValue(select, '10')
      changeValue(titleInput, createdTask.taskTitle)
      changeValue(description, createdTask.taskDescription)
    })
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(onboardingApiMock.createOnboardingTask).toHaveBeenCalledOnce()
    expect(onboardingApiMock.fetchOnboardingTasks).toHaveBeenLastCalledWith(0, 20)
    expect(buttonWithText(createdTask.taskTitle)?.getAttribute('aria-pressed')).toBe('true')
  })

  it('synchronizes an updated task in the list', async () => {
    const updatedTask = { ...firstTask, taskTitle: '입사 서류 검토' }
    onboardingApiMock.updateOnboardingTask.mockResolvedValue(updatedTask)

    await renderPage()
    await act(async () => buttonWithText('수정')?.click())

    const form = container.querySelector<HTMLFormElement>('form')
    const titleInput = form?.querySelector<HTMLInputElement>('input:not([type="number"])')
    if (!form || !titleInput) throw new Error('Update task form was not rendered')

    await act(async () => changeValue(titleInput, updatedTask.taskTitle))
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(onboardingApiMock.updateOnboardingTask).toHaveBeenCalledOnce()
    expect(buttonWithText(updatedTask.taskTitle)?.getAttribute('aria-pressed')).toBe('true')
    expect(buttonWithText(firstTask.taskTitle)).toBeUndefined()
  })
})
