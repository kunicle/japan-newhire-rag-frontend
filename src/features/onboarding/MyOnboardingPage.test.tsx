import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MyOnboardingPage } from './MyOnboardingPage'
import type { MyOnboardingItem } from './onboardingTypes'

const onboardingApiMock = vi.hoisted(() => ({
  completeOnboardingTask: vi.fn(),
  fetchMyOnboarding: vi.fn(),
  startOnboardingTask: vi.fn(),
}))

vi.mock('./onboardingApi', () => onboardingApiMock)

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true

const notStartedTask: MyOnboardingItem = {
  onboardingAssignmentId: 11,
  onboardingTaskId: 101,
  departmentId: 10,
  taskTitle: '입사 서류 제출',
  taskDescription: '입사 서류를 인사팀에 제출합니다.',
  assignedDate: '2026-09-01',
  dueDate: '2026-09-08',
  assignmentStatus: 'ASSIGNED',
  completionStatus: 'NOT_STARTED',
  completionNote: null,
  completedAt: null,
  overdue: false,
}

const inProgressTask: MyOnboardingItem = {
  ...notStartedTask,
  completionStatus: 'IN_PROGRESS',
}

const completedTask: MyOnboardingItem = {
  ...notStartedTask,
  onboardingAssignmentId: 12,
  onboardingTaskId: 102,
  taskTitle: '보안 교육 수강',
  taskDescription: '필수 보안 교육을 수강합니다.',
  assignmentStatus: 'COMPLETED',
  completionStatus: 'COMPLETED',
  completedAt: '2026-09-03T15:30:00+09:00',
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })
  return { promise, resolve }
}

describe('MyOnboardingPage', () => {
  let container: HTMLDivElement
  let root: Root | null

  beforeEach(() => {
    Object.values(onboardingApiMock).forEach((mock) => mock.mockReset())
    onboardingApiMock.fetchMyOnboarding.mockResolvedValue([notStartedTask])
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
      root?.render(<MyOnboardingPage />)
    })
  }

  function buttonWithText(text: string) {
    return [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === text,
    )
  }

  function taskItemWithTitle(title: string) {
    return [...container.querySelectorAll('li')].find((item) =>
      item.textContent?.includes(title),
    )
  }

  it('fetches the current employee onboarding assignments on entry', async () => {
    await renderPage()

    expect(onboardingApiMock.fetchMyOnboarding).toHaveBeenCalledOnce()
  })

  it('renders server tasks and their completion status', async () => {
    onboardingApiMock.fetchMyOnboarding.mockResolvedValue([
      notStartedTask,
      completedTask,
    ])

    await renderPage()

    expect(container.textContent).toContain(notStartedTask.taskTitle)
    expect(container.textContent).toContain(notStartedTask.taskDescription)
    expect(container.textContent).toContain(completedTask.taskTitle)
    expect(container.textContent).toContain('시작 전')
    expect(container.textContent).toContain('완료 1 / 전체 2')
    expect(container.textContent).toContain('완료일시')
  })

  it('renders an empty state when no task is assigned', async () => {
    onboardingApiMock.fetchMyOnboarding.mockResolvedValue([])

    await renderPage()

    expect(container.textContent).toContain('배정된 온보딩이 없습니다.')
    expect(container.textContent).toContain(
      '새로운 온보딩 할 일이 배정되면 이곳에서 확인할 수 있습니다.',
    )
  })

  it('renders an initial loading error and retries', async () => {
    onboardingApiMock.fetchMyOnboarding
      .mockRejectedValueOnce(new Error('HTTP 500'))
      .mockResolvedValueOnce([notStartedTask])

    await renderPage()

    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      '온보딩 정보를 불러오지 못했습니다.',
    )

    await act(async () => buttonWithText('다시 시도')?.click())

    expect(onboardingApiMock.fetchMyOnboarding).toHaveBeenCalledTimes(2)
    expect(container.textContent).toContain(notStartedTask.taskTitle)
  })

  it('starts a NOT_STARTED task and refreshes the screen', async () => {
    onboardingApiMock.startOnboardingTask.mockResolvedValue(inProgressTask)
    onboardingApiMock.fetchMyOnboarding
      .mockResolvedValueOnce([notStartedTask])
      .mockResolvedValueOnce([inProgressTask])

    await renderPage()
    await act(async () => buttonWithText('시작')?.click())

    expect(onboardingApiMock.startOnboardingTask).toHaveBeenCalledWith(
      notStartedTask.onboardingAssignmentId,
    )
    expect(onboardingApiMock.fetchMyOnboarding).toHaveBeenCalledTimes(2)
    expect(container.textContent).toContain('진행 중')
    expect(buttonWithText('완료')).not.toBeUndefined()
  })

  it('completes an IN_PROGRESS task and refreshes the screen', async () => {
    const completedAfterAction = {
      ...inProgressTask,
      assignmentStatus: 'COMPLETED' as const,
      completionStatus: 'COMPLETED' as const,
      completedAt: '2026-09-07T10:00:00+09:00',
    }
    onboardingApiMock.completeOnboardingTask.mockResolvedValue(completedAfterAction)
    onboardingApiMock.fetchMyOnboarding
      .mockResolvedValueOnce([inProgressTask])
      .mockResolvedValueOnce([completedAfterAction])

    await renderPage()
    await act(async () => buttonWithText('완료')?.click())

    expect(onboardingApiMock.completeOnboardingTask).toHaveBeenCalledWith(
      inProgressTask.onboardingAssignmentId,
    )
    expect(onboardingApiMock.fetchMyOnboarding).toHaveBeenCalledTimes(2)
    expect(container.textContent).toContain('완료 1 / 전체 1')
    expect(buttonWithText('완료')).toBeUndefined()
  })

  it('renders an error on the task when starting fails', async () => {
    onboardingApiMock.startOnboardingTask.mockRejectedValue(new Error('HTTP 500'))

    await renderPage()
    await act(async () => buttonWithText('시작')?.click())

    const taskItem = taskItemWithTitle(notStartedTask.taskTitle)
    expect(taskItem?.querySelector('[role="alert"]')?.textContent).toContain(
      '온보딩 시작에 실패했습니다.',
    )
    expect(onboardingApiMock.fetchMyOnboarding).toHaveBeenCalledOnce()
  })

  it('renders an error on the task when completion fails', async () => {
    onboardingApiMock.fetchMyOnboarding.mockResolvedValue([inProgressTask])
    onboardingApiMock.completeOnboardingTask.mockRejectedValue(new Error('HTTP 500'))

    await renderPage()
    await act(async () => buttonWithText('완료')?.click())

    const taskItem = taskItemWithTitle(inProgressTask.taskTitle)
    expect(taskItem?.querySelector('[role="alert"]')?.textContent).toContain(
      '온보딩 완료 처리에 실패했습니다.',
    )
    expect(onboardingApiMock.fetchMyOnboarding).toHaveBeenCalledOnce()
  })

  it('does not render action buttons for CANCELLED or COMPLETED tasks', async () => {
    const cancelledTask: MyOnboardingItem = {
      ...notStartedTask,
      assignmentStatus: 'CANCELLED',
    }
    onboardingApiMock.fetchMyOnboarding.mockResolvedValue([
      cancelledTask,
      completedTask,
    ])

    await renderPage()

    expect(taskItemWithTitle(cancelledTask.taskTitle)?.textContent).toContain('취소됨')
    expect(buttonWithText('시작')).toBeUndefined()
    expect(buttonWithText('완료')).toBeUndefined()
  })

  it('calls the action API only once when the same button is clicked repeatedly', async () => {
    const pendingStart = deferred<MyOnboardingItem>()
    onboardingApiMock.startOnboardingTask.mockReturnValue(pendingStart.promise)
    onboardingApiMock.fetchMyOnboarding
      .mockResolvedValueOnce([notStartedTask])
      .mockResolvedValueOnce([inProgressTask])

    await renderPage()
    const startButton = buttonWithText('시작')
    if (!startButton) throw new Error('Start button was not rendered')

    act(() => {
      startButton.click()
      startButton.click()
    })

    expect(onboardingApiMock.startOnboardingTask).toHaveBeenCalledOnce()

    await act(async () => pendingStart.resolve(inProgressTask))

    expect(onboardingApiMock.fetchMyOnboarding).toHaveBeenCalledTimes(2)
  })
})
