import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MyEducationDetailPage } from './MyEducationDetailPage'
import type {
  LearningProgressUpdateResult,
  MyCourseDetail,
  MyCourseModule,
} from './educationTypes'

const educationApiMock = vi.hoisted(() => ({
  completeLearningProgress: vi.fn(),
  fetchMyCourseDetail: vi.fn(),
  startLearningProgress: vi.fn(),
}))

vi.mock('./educationApi', () => educationApiMock)

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true

const notStartedModule: MyCourseModule = {
  progressId: 201,
  moduleId: 301,
  moduleTitle: '정보보안 기본',
  moduleContent: '비밀번호와 사내 정보보안 수칙을 학습합니다.',
  referenceUrl: 'https://example.test/security-guide',
  moduleOrder: 1,
  required: true,
  completionStatus: 'NOT_STARTED',
  startedAt: null,
  completedAt: null,
}

const inProgressModule: MyCourseModule = {
  ...notStartedModule,
  progressId: 202,
  moduleId: 302,
  moduleTitle: '협업 도구 실습',
  moduleOrder: 2,
  required: false,
  completionStatus: 'IN_PROGRESS',
  startedAt: '2026-09-03T09:00:00+09:00',
}

const completedModule: MyCourseModule = {
  ...notStartedModule,
  progressId: 203,
  moduleId: 303,
  moduleTitle: '사내 규정 확인',
  moduleOrder: 3,
  completionStatus: 'COMPLETED',
  startedAt: '2026-09-01T09:00:00+09:00',
  completedAt: '2026-09-02T18:00:00+09:00',
}

const courseDetail: MyCourseDetail = {
  enrollmentId: 11,
  courseId: 101,
  courseName: '신입사원 필수 교육',
  courseDescription: '입사 후 필요한 기본 업무와 보안 규정을 학습합니다.',
  required: true,
  enrollmentRound: '2026-09',
  enrollmentStartDate: '2026-09-01',
  enrollmentDueDate: '2026-09-30',
  progressRate: 40,
  status: 'IN_PROGRESS',
  completedAt: null,
  modules: [notStartedModule, inProgressModule, completedModule],
}

function progressResult(
  module: MyCourseModule,
  completionStatus: LearningProgressUpdateResult['completionStatus'],
): LearningProgressUpdateResult {
  return {
    progressId: module.progressId,
    enrollmentId: courseDetail.enrollmentId,
    moduleId: module.moduleId,
    completionStatus,
    startedAt: completionStatus === 'NOT_STARTED' ? null : '2026-09-07T10:00:00+09:00',
    completedAt: completionStatus === 'COMPLETED' ? '2026-09-07T11:00:00+09:00' : null,
    progressRate: completionStatus === 'COMPLETED' ? 100 : 40,
    enrollmentStatus: completionStatus === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })
  return { promise, resolve }
}

describe('MyEducationDetailPage', () => {
  let container: HTMLDivElement
  let root: Root | null

  beforeEach(() => {
    Object.values(educationApiMock).forEach((mock) => mock.mockReset())
    educationApiMock.fetchMyCourseDetail.mockResolvedValue(courseDetail)
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

  async function renderPage(path = `/me/education/${courseDetail.enrollmentId}`) {
    root = createRoot(container)
    await act(async () => {
      root?.render(
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route
              path="/me/education/:enrollmentId"
              element={<MyEducationDetailPage />}
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

  function moduleItemWithTitle(title: string) {
    return [...container.querySelectorAll('li')].find((item) =>
      item.textContent?.includes(title),
    )
  }

  it('fetches the detail using the enrollment id from the route', async () => {
    await renderPage('/me/education/47')

    expect(educationApiMock.fetchMyCourseDetail).toHaveBeenCalledOnce()
    expect(educationApiMock.fetchMyCourseDetail).toHaveBeenCalledWith(47)
  })

  it('does not fetch for an invalid enrollment id and renders an error with a back link', async () => {
    await renderPage('/me/education/not-a-number')

    expect(educationApiMock.fetchMyCourseDetail).not.toHaveBeenCalled()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      '잘못된 교육 과정 정보입니다.',
    )
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/me/education')
  })

  it('renders the course summary, enrollment period, status, and progress', async () => {
    await renderPage()

    expect(container.textContent).toContain(courseDetail.courseName)
    expect(container.textContent).toContain(courseDetail.courseDescription)
    expect(container.textContent).toContain('필수')
    expect(container.textContent).toContain('진행 중')
    expect(container.textContent).toContain('교육 차수')
    expect(container.textContent).toContain(courseDetail.enrollmentRound)
    expect(container.textContent).toContain('학습 기간')
    expect(container.textContent).toContain('40%')
  })

  it('exposes course progress through progressbar aria attributes', async () => {
    await renderPage()

    const progressbar = container.querySelector(
      `[role="progressbar"][aria-label="${courseDetail.courseName} 진행률"]`,
    )
    expect(progressbar?.getAttribute('aria-valuenow')).toBe('40')
    expect(progressbar?.getAttribute('aria-valuemin')).toBe('0')
    expect(progressbar?.getAttribute('aria-valuemax')).toBe('100')
  })

  it('renders module details, status, content, and reference link', async () => {
    await renderPage()

    const moduleItem = moduleItemWithTitle(notStartedModule.moduleTitle)
    expect(moduleItem?.textContent).toContain('필수')
    expect(moduleItem?.textContent).toContain('시작 전')
    expect(moduleItem?.textContent).toContain(notStartedModule.moduleContent)
    const referenceLink = moduleItem?.querySelector('a')
    expect(referenceLink?.textContent).toContain('참고 자료 열기')
    expect(referenceLink?.getAttribute('href')).toBe(notStartedModule.referenceUrl)
    expect(referenceLink?.getAttribute('target')).toBe('_blank')
  })

  it('renders an empty state when the course has no modules', async () => {
    educationApiMock.fetchMyCourseDetail.mockResolvedValue({
      ...courseDetail,
      modules: [],
    })

    await renderPage()

    expect(container.textContent).toContain('학습 모듈이 없습니다.')
    expect(container.textContent).toContain('등록된 학습 모듈이 없습니다.')
  })

  it('renders a detail error and retries the request', async () => {
    educationApiMock.fetchMyCourseDetail
      .mockRejectedValueOnce(new Error('HTTP 500'))
      .mockResolvedValueOnce(courseDetail)

    await renderPage()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      '교육 과정 정보를 불러오지 못했습니다.',
    )

    await act(async () => buttonWithText('다시 시도')?.click())

    expect(educationApiMock.fetchMyCourseDetail).toHaveBeenCalledTimes(2)
    expect(container.textContent).toContain(courseDetail.courseName)
  })

  it('starts a NOT_STARTED module and refreshes the detail', async () => {
    const refreshedDetail: MyCourseDetail = {
      ...courseDetail,
      modules: [
        { ...notStartedModule, completionStatus: 'IN_PROGRESS' },
        inProgressModule,
        completedModule,
      ],
    }
    educationApiMock.startLearningProgress.mockResolvedValue(
      progressResult(notStartedModule, 'IN_PROGRESS'),
    )
    educationApiMock.fetchMyCourseDetail
      .mockResolvedValueOnce(courseDetail)
      .mockResolvedValueOnce(refreshedDetail)

    await renderPage()
    await act(async () => {
      moduleItemWithTitle(notStartedModule.moduleTitle)
        ?.querySelector<HTMLButtonElement>('button')
        ?.click()
    })

    expect(educationApiMock.startLearningProgress).toHaveBeenCalledWith(
      notStartedModule.progressId,
    )
    expect(educationApiMock.fetchMyCourseDetail).toHaveBeenCalledTimes(2)
    expect(moduleItemWithTitle(notStartedModule.moduleTitle)?.textContent).toContain(
      '진행 중',
    )
  })

  it('completes an IN_PROGRESS module and refreshes the detail', async () => {
    const refreshedDetail: MyCourseDetail = {
      ...courseDetail,
      progressRate: 100,
      modules: [
        notStartedModule,
        {
          ...inProgressModule,
          completionStatus: 'COMPLETED',
          completedAt: '2026-09-07T11:00:00+09:00',
        },
        completedModule,
      ],
    }
    educationApiMock.completeLearningProgress.mockResolvedValue(
      progressResult(inProgressModule, 'COMPLETED'),
    )
    educationApiMock.fetchMyCourseDetail
      .mockResolvedValueOnce(courseDetail)
      .mockResolvedValueOnce(refreshedDetail)

    await renderPage()
    await act(async () => {
      moduleItemWithTitle(inProgressModule.moduleTitle)
        ?.querySelector<HTMLButtonElement>('button')
        ?.click()
    })

    expect(educationApiMock.completeLearningProgress).toHaveBeenCalledWith(
      inProgressModule.progressId,
    )
    expect(educationApiMock.fetchMyCourseDetail).toHaveBeenCalledTimes(2)
    expect(moduleItemWithTitle(inProgressModule.moduleTitle)?.textContent).toContain(
      '완료',
    )
  })

  it('renders module-scoped errors when start and completion actions fail', async () => {
    educationApiMock.startLearningProgress.mockRejectedValue(new Error('HTTP 500'))
    educationApiMock.completeLearningProgress.mockRejectedValue(new Error('HTTP 500'))

    await renderPage()
    await act(async () => {
      moduleItemWithTitle(notStartedModule.moduleTitle)
        ?.querySelector<HTMLButtonElement>('button')
        ?.click()
    })
    await act(async () => {
      moduleItemWithTitle(inProgressModule.moduleTitle)
        ?.querySelector<HTMLButtonElement>('button')
        ?.click()
    })

    expect(
      moduleItemWithTitle(notStartedModule.moduleTitle)
        ?.querySelector('[role="alert"]')?.textContent,
    ).toContain('학습 시작에 실패했습니다.')
    expect(
      moduleItemWithTitle(inProgressModule.moduleTitle)
        ?.querySelector('[role="alert"]')?.textContent,
    ).toContain('학습 완료 처리에 실패했습니다.')
    expect(educationApiMock.fetchMyCourseDetail).toHaveBeenCalledOnce()
  })

  it('does not render start or completion buttons for a COMPLETED module', async () => {
    educationApiMock.fetchMyCourseDetail.mockResolvedValue({
      ...courseDetail,
      modules: [completedModule],
    })

    await renderPage()

    const moduleItem = moduleItemWithTitle(completedModule.moduleTitle)
    expect(moduleItem?.textContent).toContain('완료')
    expect(moduleItem?.querySelector('button')).toBeNull()
  })

  it('calls a progress API only once when the same action is clicked repeatedly', async () => {
    const pendingStart = deferred<LearningProgressUpdateResult>()
    educationApiMock.startLearningProgress.mockReturnValue(pendingStart.promise)
    educationApiMock.fetchMyCourseDetail
      .mockResolvedValueOnce(courseDetail)
      .mockResolvedValueOnce(courseDetail)

    await renderPage()
    const startButton = moduleItemWithTitle(notStartedModule.moduleTitle)
      ?.querySelector<HTMLButtonElement>('button')
    if (!startButton) throw new Error('Start button was not rendered')

    act(() => {
      startButton.click()
      startButton.click()
    })

    expect(educationApiMock.startLearningProgress).toHaveBeenCalledOnce()

    await act(async () => {
      pendingStart.resolve(progressResult(notStartedModule, 'IN_PROGRESS'))
    })
    expect(educationApiMock.fetchMyCourseDetail).toHaveBeenCalledTimes(2)
  })

  it('renders date fallbacks for invalid course and module timestamps', async () => {
    educationApiMock.fetchMyCourseDetail.mockResolvedValue({
      ...courseDetail,
      enrollmentStartDate: 'invalid-start-date',
      enrollmentDueDate: 'invalid-due-date',
      completedAt: 'invalid-course-completed-at',
      modules: [
        {
          ...completedModule,
          startedAt: 'invalid-module-started-at',
          completedAt: 'invalid-module-completed-at',
        },
      ],
    })

    await renderPage()

    expect(container.textContent?.match(/날짜 정보 없음/g)).toHaveLength(5)
  })
})
