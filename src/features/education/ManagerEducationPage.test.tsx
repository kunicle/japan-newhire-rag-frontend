import { StrictMode, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ManagerEducationPage } from './ManagerEducationPage'
import type {
  ManagerEducationItem,
  ManagerEducationPage as ManagerEducationPageData,
} from './educationTypes'

const managerEducationApiMock = vi.hoisted(() => ({
  fetchTeamEducation: vi.fn(),
}))

vi.mock('./managerEducationApi', () => managerEducationApiMock)

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true

const inProgressEducation: ManagerEducationItem = {
  employeeId: 101,
  employeeName: '김신입',
  departmentId: 10,
  departmentName: '개발팀',
  enrollmentId: 1001,
  courseId: 201,
  courseName: '정보보안 기본 교육',
  progressRate: 45,
  status: 'IN_PROGRESS',
  dueDate: '2026-09-30',
  overdue: false,
}

const completedEducation: ManagerEducationItem = {
  employeeId: 102,
  employeeName: '이사원',
  departmentId: 20,
  departmentName: '인사팀',
  enrollmentId: 1002,
  courseId: 202,
  courseName: '사내 협업 도구 안내',
  progressRate: 100,
  status: 'COMPLETED',
  dueDate: '2026-10-07',
  overdue: false,
}

const overdueEducation: ManagerEducationItem = {
  ...inProgressEducation,
  employeeId: 103,
  employeeName: '박지연',
  enrollmentId: 1003,
  courseId: 203,
  courseName: '개인정보 보호 교육',
  progressRate: 20,
  status: 'OVERDUE',
  dueDate: '2026-08-31',
  overdue: true,
}

function educationPage(
  content: ManagerEducationItem[],
  page = 0,
  totalPages = content.length === 0 ? 0 : 1,
): ManagerEducationPageData {
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

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })
  return { promise, resolve }
}

describe('ManagerEducationPage', () => {
  let container: HTMLDivElement
  let root: Root | null

  beforeEach(() => {
    managerEducationApiMock.fetchTeamEducation.mockReset()
    managerEducationApiMock.fetchTeamEducation.mockResolvedValue(
      educationPage([inProgressEducation, completedEducation]),
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

  async function renderPage(strict = false) {
    root = createRoot(container)
    const page = (
      <MemoryRouter>
        <ManagerEducationPage />
      </MemoryRouter>
    )

    await act(async () => {
      root?.render(strict ? <StrictMode>{page}</StrictMode> : page)
    })
  }

  function buttonWithText(text: string) {
    return [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === text,
    )
  }

  function educationItemWithEmployee(employeeName: string) {
    return [...container.querySelectorAll('li')].find((item) =>
      item.textContent?.includes(employeeName),
    )
  }

  it('fetches the first team education page with twenty items on entry', async () => {
    await renderPage()

    expect(managerEducationApiMock.fetchTeamEducation).toHaveBeenCalledOnce()
    expect(managerEducationApiMock.fetchTeamEducation).toHaveBeenCalledWith(0, 20)
  })

  it('renders employee, department, course, status, progress, and due date', async () => {
    await renderPage()

    expect(container.textContent).toContain(inProgressEducation.employeeName)
    expect(container.textContent).toContain(inProgressEducation.departmentName)
    expect(container.textContent).toContain(inProgressEducation.courseName)
    expect(container.textContent).toContain('진행 중')
    expect(container.textContent).toContain('45%')
    expect(container.textContent).toContain('학습 기한')
    expect(container.querySelector(
      `time[datetime="${inProgressEducation.dueDate}"]`,
    )).not.toBeNull()
  })

  it('links each item to the employee education page', async () => {
    await renderPage()

    const item = educationItemWithEmployee(inProgressEducation.employeeName)
    expect(item?.querySelector('a')?.getAttribute('href')).toBe(
      `/manager/education/${inProgressEducation.employeeId}`,
    )
  })

  it('exposes progress through progressbar aria attributes', async () => {
    await renderPage()

    const progressbar = container.querySelector(
      `[role="progressbar"][aria-label="${inProgressEducation.employeeName} ${inProgressEducation.courseName} 진행률"]`,
    )
    expect(progressbar?.getAttribute('aria-valuenow')).toBe('45')
    expect(progressbar?.getAttribute('aria-valuemin')).toBe('0')
    expect(progressbar?.getAttribute('aria-valuemax')).toBe('100')
  })

  it('distinguishes overdue education with its status label', async () => {
    managerEducationApiMock.fetchTeamEducation.mockResolvedValue(
      educationPage([overdueEducation]),
    )

    await renderPage()

    expect(educationItemWithEmployee(overdueEducation.employeeName)?.textContent)
      .toContain('기한 초과')
  })

  it('renders an empty state when there is no team education', async () => {
    managerEducationApiMock.fetchTeamEducation.mockResolvedValue(educationPage([]))

    await renderPage()

    expect(container.textContent).toContain('관리 중인 직원의 교육 현황이 없습니다.')
    expect(container.textContent).toContain(
      '관리 대상 직원에게 교육이 배정되면 이곳에서 확인할 수 있습니다.',
    )
  })

  it('renders a safe error when the initial request fails', async () => {
    managerEducationApiMock.fetchTeamEducation.mockRejectedValue(
      new Error('sensitive server detail'),
    )

    await renderPage()

    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      '팀 교육 현황을 불러오지 못했습니다.',
    )
    expect(container.textContent).not.toContain('sensitive server detail')
  })

  it('requests the current page again when retry is clicked', async () => {
    managerEducationApiMock.fetchTeamEducation
      .mockRejectedValueOnce(new Error('HTTP 500'))
      .mockResolvedValueOnce(educationPage([inProgressEducation]))

    await renderPage()
    await act(async () => buttonWithText('다시 시도')?.click())

    expect(managerEducationApiMock.fetchTeamEducation).toHaveBeenCalledTimes(2)
    expect(managerEducationApiMock.fetchTeamEducation).toHaveBeenLastCalledWith(0, 20)
    expect(container.textContent).toContain(inProgressEducation.employeeName)
  })

  it('fetches the next page with twenty items', async () => {
    managerEducationApiMock.fetchTeamEducation
      .mockResolvedValueOnce(educationPage([inProgressEducation], 0, 2))
      .mockResolvedValueOnce(educationPage([completedEducation], 1, 2))

    await renderPage()
    await act(async () => buttonWithText('다음')?.click())

    expect(managerEducationApiMock.fetchTeamEducation).toHaveBeenLastCalledWith(1, 20)
    expect(container.textContent).toContain('페이지 2 / 2')
    expect(container.textContent).toContain(completedEducation.employeeName)
  })

  it('moves to the previous page and disables buttons at page boundaries', async () => {
    managerEducationApiMock.fetchTeamEducation
      .mockResolvedValueOnce(educationPage([inProgressEducation], 0, 3))
      .mockResolvedValueOnce(educationPage([inProgressEducation], 1, 3))
      .mockResolvedValueOnce(educationPage([completedEducation], 2, 3))
      .mockResolvedValueOnce(educationPage([inProgressEducation], 1, 3))

    await renderPage()
    expect(buttonWithText('이전')?.disabled).toBe(true)
    expect(buttonWithText('다음')?.disabled).toBe(false)

    await act(async () => buttonWithText('다음')?.click())
    await act(async () => buttonWithText('다음')?.click())
    expect(buttonWithText('이전')?.disabled).toBe(false)
    expect(buttonWithText('다음')?.disabled).toBe(true)

    await act(async () => buttonWithText('이전')?.click())
    expect(managerEducationApiMock.fetchTeamEducation).toHaveBeenLastCalledWith(1, 20)
    expect(container.textContent).toContain('페이지 2 / 3')
  })

  it('renders a fallback for an invalid due date', async () => {
    managerEducationApiMock.fetchTeamEducation.mockResolvedValue(
      educationPage([{ ...inProgressEducation, dueDate: 'not-a-date' }]),
    )

    await renderPage()

    expect(container.textContent).toContain('학습 기한 날짜 정보 없음')
  })

  it('ignores a response that arrives after the component unmounts', async () => {
    const pendingRequest = deferred<ManagerEducationPageData>()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    managerEducationApiMock.fetchTeamEducation.mockReturnValue(pendingRequest.promise)

    await renderPage()
    await act(async () => root?.unmount())
    root = null
    await act(async () => pendingRequest.resolve(educationPage([inProgressEducation])))

    expect(container.innerHTML).toBe('')
    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('keeps the latest screen when overlapping responses arrive out of order', async () => {
    const olderRequest = deferred<ManagerEducationPageData>()
    const latestRequest = deferred<ManagerEducationPageData>()
    managerEducationApiMock.fetchTeamEducation
      .mockReturnValueOnce(olderRequest.promise)
      .mockReturnValueOnce(latestRequest.promise)

    await renderPage(true)
    expect(managerEducationApiMock.fetchTeamEducation).toHaveBeenCalledTimes(2)

    await act(async () => latestRequest.resolve(educationPage([completedEducation])))
    expect(container.textContent).toContain(completedEducation.employeeName)

    await act(async () => olderRequest.resolve(educationPage([inProgressEducation])))
    expect(container.textContent).toContain(completedEducation.employeeName)
    expect(container.textContent).not.toContain(inProgressEducation.employeeName)
  })
})
