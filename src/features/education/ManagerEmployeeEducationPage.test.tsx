import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  MemoryRouter,
  Route,
  Routes,
  useNavigate,
  type NavigateFunction,
} from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ManagerEmployeeEducationPage } from './ManagerEmployeeEducationPage'
import type {
  ManagerEducationItem,
  ManagerEducationPage,
} from './educationTypes'

const managerEducationApiMock = vi.hoisted(() => ({
  fetchEmployeeCourses: vi.fn(),
}))

vi.mock('./managerEducationApi', () => managerEducationApiMock)

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true

const employeeId = 101

const inProgressEducation: ManagerEducationItem = {
  employeeId,
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
  ...inProgressEducation,
  enrollmentId: 1002,
  courseId: 202,
  courseName: '사내 협업 도구 안내',
  progressRate: 100,
  status: 'COMPLETED',
  dueDate: '2026-10-07',
}

const overdueEducation: ManagerEducationItem = {
  ...inProgressEducation,
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
): ManagerEducationPage {
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

describe('ManagerEmployeeEducationPage', () => {
  let container: HTMLDivElement
  let root: Root | null
  let navigate: NavigateFunction | null

  function NavigationCapture() {
    navigate = useNavigate()
    return null
  }

  beforeEach(() => {
    managerEducationApiMock.fetchEmployeeCourses.mockReset()
    managerEducationApiMock.fetchEmployeeCourses.mockResolvedValue(
      educationPage([inProgressEducation, completedEducation]),
    )
    navigate = null
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

  async function renderPage(path = `/manager/education/${employeeId}`) {
    root = createRoot(container)
    await act(async () => {
      root?.render(
        <MemoryRouter initialEntries={[path]}>
          <NavigationCapture />
          <Routes>
            <Route
              path="/manager/education/:employeeId"
              element={<ManagerEmployeeEducationPage />}
            />
          </Routes>
        </MemoryRouter>,
      )
    })
  }

  function buttonWithText(text: string) {
    return [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === text,
    )
  }

  function courseItemWithTitle(courseName: string) {
    return [...container.querySelectorAll('li')].find((item) =>
      item.textContent?.includes(courseName),
    )
  }

  it('fetches the employee first education page with twenty items on entry', async () => {
    await renderPage('/manager/education/47')

    expect(managerEducationApiMock.fetchEmployeeCourses).toHaveBeenCalledOnce()
    expect(managerEducationApiMock.fetchEmployeeCourses).toHaveBeenCalledWith(47, 0, 20)
  })

  it('does not fetch for an invalid employee id and renders a safe message', async () => {
    await renderPage('/manager/education/not-a-number')

    expect(managerEducationApiMock.fetchEmployeeCourses).not.toHaveBeenCalled()
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      '잘못된 직원 정보입니다.',
    )
  })

  it('renders employee, department, and assigned course information', async () => {
    await renderPage()

    expect(container.textContent).toContain(`${inProgressEducation.employeeName} 교육 현황`)
    expect(container.textContent).toContain(inProgressEducation.departmentName)
    expect(container.textContent).toContain(inProgressEducation.courseName)
    expect(container.textContent).toContain(completedEducation.courseName)
  })

  it('renders course status, progress, and due date', async () => {
    await renderPage()

    expect(container.textContent).toContain('진행 중')
    expect(container.textContent).toContain('완료')
    expect(container.textContent).toContain('45%')
    expect(container.textContent).toContain('100%')
    expect(container.querySelector(
      `time[datetime="${inProgressEducation.dueDate}"]`,
    )).not.toBeNull()
  })

  it('exposes progress through progressbar aria attributes', async () => {
    await renderPage()

    const progressbar = container.querySelector(
      `[role="progressbar"][aria-label="${inProgressEducation.courseName} 진행률"]`,
    )
    expect(progressbar?.getAttribute('aria-valuenow')).toBe('45')
    expect(progressbar?.getAttribute('aria-valuemin')).toBe('0')
    expect(progressbar?.getAttribute('aria-valuemax')).toBe('100')
  })

  it('distinguishes overdue education with its status label', async () => {
    managerEducationApiMock.fetchEmployeeCourses.mockResolvedValue(
      educationPage([overdueEducation]),
    )

    await renderPage()

    expect(courseItemWithTitle(overdueEducation.courseName)?.textContent)
      .toContain('기한 초과')
  })

  it('renders an empty state when the employee has no assigned courses', async () => {
    managerEducationApiMock.fetchEmployeeCourses.mockResolvedValue(educationPage([]))

    await renderPage()

    expect(container.textContent).toContain('해당 직원에게 배정된 교육 과정이 없습니다.')
    expect(container.textContent).toContain(
      '교육 과정이 배정되면 이곳에서 확인할 수 있습니다.',
    )
  })

  it('renders a safe error when the initial request fails', async () => {
    managerEducationApiMock.fetchEmployeeCourses.mockRejectedValue(
      new Error('sensitive server detail'),
    )

    await renderPage()

    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      '직원의 교육 현황을 불러오지 못했습니다.',
    )
    expect(container.textContent).not.toContain('sensitive server detail')
  })

  it('retries the same employee and page', async () => {
    managerEducationApiMock.fetchEmployeeCourses
      .mockRejectedValueOnce(new Error('HTTP 500'))
      .mockResolvedValueOnce(educationPage([inProgressEducation]))

    await renderPage()
    await act(async () => buttonWithText('다시 시도')?.click())

    expect(managerEducationApiMock.fetchEmployeeCourses).toHaveBeenCalledTimes(2)
    expect(managerEducationApiMock.fetchEmployeeCourses).toHaveBeenLastCalledWith(
      employeeId,
      0,
      20,
    )
    expect(container.textContent).toContain(inProgressEducation.courseName)
  })

  it('fetches the next employee education page', async () => {
    managerEducationApiMock.fetchEmployeeCourses
      .mockResolvedValueOnce(educationPage([inProgressEducation], 0, 2))
      .mockResolvedValueOnce(educationPage([completedEducation], 1, 2))

    await renderPage()
    await act(async () => buttonWithText('다음')?.click())

    expect(managerEducationApiMock.fetchEmployeeCourses).toHaveBeenLastCalledWith(
      employeeId,
      1,
      20,
    )
    expect(container.textContent).toContain('페이지 2 / 2')
    expect(container.textContent).toContain(completedEducation.courseName)
  })

  it('moves to the previous page and disables buttons at page boundaries', async () => {
    managerEducationApiMock.fetchEmployeeCourses
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
    expect(managerEducationApiMock.fetchEmployeeCourses).toHaveBeenLastCalledWith(
      employeeId,
      1,
      20,
    )
    expect(container.textContent).toContain('페이지 2 / 3')
  })

  it('renders a fallback for an invalid due date', async () => {
    managerEducationApiMock.fetchEmployeeCourses.mockResolvedValue(
      educationPage([{ ...inProgressEducation, dueDate: 'not-a-date' }]),
    )

    await renderPage()

    expect(container.textContent).toContain('학습 기한 날짜 정보 없음')
  })

  it('links back to the team education list', async () => {
    await renderPage()

    const backLink = [...container.querySelectorAll('a')].find(
      (link) => link.textContent?.trim() === '팀 교육 현황으로 돌아가기',
    )
    expect(backLink?.getAttribute('href')).toBe('/manager/education')
  })

  it('ignores a response that arrives after the component unmounts', async () => {
    const pendingRequest = deferred<ManagerEducationPage>()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    managerEducationApiMock.fetchEmployeeCourses.mockReturnValue(pendingRequest.promise)

    await renderPage()
    await act(async () => root?.unmount())
    root = null
    await act(async () => pendingRequest.resolve(educationPage([inProgressEducation])))

    expect(container.innerHTML).toBe('')
    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('keeps the latest employee screen when route requests resolve out of order', async () => {
    const olderRequest = deferred<ManagerEducationPage>()
    const latestRequest = deferred<ManagerEducationPage>()
    const nextEmployeeEducation: ManagerEducationItem = {
      ...inProgressEducation,
      employeeId: 202,
      employeeName: '이사원',
      enrollmentId: 2001,
      courseName: '신입사원 업무 교육',
    }
    managerEducationApiMock.fetchEmployeeCourses
      .mockReturnValueOnce(olderRequest.promise)
      .mockReturnValueOnce(latestRequest.promise)

    await renderPage()
    if (!navigate) throw new Error('Router navigation was not initialized')
    await act(async () => navigate?.('/manager/education/202'))

    expect(managerEducationApiMock.fetchEmployeeCourses).toHaveBeenNthCalledWith(
      1,
      employeeId,
      0,
      20,
    )
    expect(managerEducationApiMock.fetchEmployeeCourses).toHaveBeenNthCalledWith(
      2,
      202,
      0,
      20,
    )

    await act(async () => latestRequest.resolve(educationPage([nextEmployeeEducation])))
    expect(container.textContent).toContain('이사원 교육 현황')

    await act(async () => olderRequest.resolve(educationPage([inProgressEducation])))
    expect(container.textContent).toContain('이사원 교육 현황')
    expect(container.textContent).not.toContain('김신입 교육 현황')
  })
})
