import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MyEducationPage } from './MyEducationPage'
import type { MyCoursePage, MyCourseSummary } from './educationTypes'

const educationApiMock = vi.hoisted(() => ({
  fetchMyCourses: vi.fn(),
}))

vi.mock('./educationApi', () => educationApiMock)

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true

const requiredCourse: MyCourseSummary = {
  enrollmentId: 11,
  courseId: 101,
  courseName: '신입사원 정보보안 교육',
  required: true,
  enrollmentDueDate: '2026-09-30',
  progressRate: 35,
  status: 'IN_PROGRESS',
}

const optionalCourse: MyCourseSummary = {
  enrollmentId: 12,
  courseId: 102,
  courseName: '사내 협업 도구 안내',
  required: false,
  enrollmentDueDate: '2026-10-07',
  progressRate: 100,
  status: 'COMPLETED',
}

function coursePage(
  content: MyCourseSummary[],
  page = 0,
  totalPages = content.length === 0 ? 0 : 1,
): MyCoursePage {
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

describe('MyEducationPage', () => {
  let container: HTMLDivElement
  let root: Root | null

  beforeEach(() => {
    educationApiMock.fetchMyCourses.mockReset()
    educationApiMock.fetchMyCourses.mockResolvedValue(
      coursePage([requiredCourse, optionalCourse]),
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
      root?.render(
        <MemoryRouter>
          <MyEducationPage />
        </MemoryRouter>,
      )
    })
  }

  function buttonWithText(text: string) {
    return [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === text,
    )
  }

  it('fetches the first course page on entry', async () => {
    await renderPage()

    expect(educationApiMock.fetchMyCourses).toHaveBeenCalledWith(0, 20)
  })

  it('renders course details, enrollment status, progress, and due date', async () => {
    await renderPage()

    expect(container.textContent).toContain(requiredCourse.courseName)
    expect(container.textContent).toContain(optionalCourse.courseName)
    expect(container.textContent).toContain('필수')
    expect(container.textContent).toContain('선택')
    expect(container.textContent).toContain('진행 중')
    expect(container.textContent).toContain('완료')
    expect(container.textContent).toContain('35%')
    expect(container.textContent).toContain('학습 기한')
    expect(container.querySelector(
      `time[datetime="${requiredCourse.enrollmentDueDate}"]`,
    )).not.toBeNull()
  })

  it('links each course to its enrollment detail route', async () => {
    await renderPage()

    const link = [...container.querySelectorAll('a')].find((anchor) =>
      anchor.textContent?.includes(requiredCourse.courseName),
    )
    expect(link?.getAttribute('href')).toBe(
      `/me/education/${requiredCourse.enrollmentId}`,
    )
  })

  it('exposes progress through text and progressbar aria attributes', async () => {
    await renderPage()

    const progressbar = container.querySelector(
      `[role="progressbar"][aria-label="${requiredCourse.courseName} 진행률"]`,
    )
    expect(progressbar?.getAttribute('aria-valuenow')).toBe('35')
    expect(progressbar?.getAttribute('aria-valuemin')).toBe('0')
    expect(progressbar?.getAttribute('aria-valuemax')).toBe('100')
    expect(progressbar?.parentElement?.textContent).toContain('35%')
  })

  it('renders an empty state when no course is assigned', async () => {
    educationApiMock.fetchMyCourses.mockResolvedValue(coursePage([]))

    await renderPage()

    expect(container.textContent).toContain('배정된 교육 과정이 없습니다.')
    expect(container.textContent).toContain(
      '새 교육 과정이 배정되면 이곳에서 확인할 수 있습니다.',
    )
  })

  it('renders an error when the initial request fails', async () => {
    educationApiMock.fetchMyCourses.mockRejectedValue(new Error('HTTP 500'))

    await renderPage()

    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      '교육 과정 목록을 불러오지 못했습니다.',
    )
  })

  it('requests the list again when retry is clicked', async () => {
    educationApiMock.fetchMyCourses
      .mockRejectedValueOnce(new Error('HTTP 500'))
      .mockResolvedValueOnce(coursePage([requiredCourse]))

    await renderPage()
    await act(async () => buttonWithText('다시 시도')?.click())

    expect(educationApiMock.fetchMyCourses).toHaveBeenCalledTimes(2)
    expect(educationApiMock.fetchMyCourses).toHaveBeenLastCalledWith(0, 20)
    expect(container.textContent).toContain(requiredCourse.courseName)
  })

  it('fetches page one when the next button is clicked', async () => {
    educationApiMock.fetchMyCourses
      .mockResolvedValueOnce(coursePage([requiredCourse], 0, 2))
      .mockResolvedValueOnce(coursePage([optionalCourse], 1, 2))

    await renderPage()
    await act(async () => buttonWithText('다음')?.click())

    expect(educationApiMock.fetchMyCourses).toHaveBeenLastCalledWith(1, 20)
    expect(container.textContent).toContain('페이지 2 / 2')
  })

  it('moves to the previous page and disables buttons on page boundaries', async () => {
    educationApiMock.fetchMyCourses
      .mockResolvedValueOnce(coursePage([requiredCourse], 0, 3))
      .mockResolvedValueOnce(coursePage([requiredCourse], 1, 3))
      .mockResolvedValueOnce(coursePage([optionalCourse], 2, 3))
      .mockResolvedValueOnce(coursePage([requiredCourse], 1, 3))

    await renderPage()
    expect(buttonWithText('이전')?.disabled).toBe(true)
    expect(buttonWithText('다음')?.disabled).toBe(false)

    await act(async () => buttonWithText('다음')?.click())
    await act(async () => buttonWithText('다음')?.click())
    expect(buttonWithText('이전')?.disabled).toBe(false)
    expect(buttonWithText('다음')?.disabled).toBe(true)

    await act(async () => buttonWithText('이전')?.click())
    expect(educationApiMock.fetchMyCourses).toHaveBeenLastCalledWith(1, 20)
    expect(container.textContent).toContain('페이지 2 / 3')
  })

  it('renders a fallback for an invalid due date', async () => {
    educationApiMock.fetchMyCourses.mockResolvedValue(coursePage([
      { ...requiredCourse, enrollmentDueDate: 'not-a-date' },
    ]))

    await renderPage()

    expect(container.textContent).toContain('학습 기한 날짜 정보 없음')
  })
})
