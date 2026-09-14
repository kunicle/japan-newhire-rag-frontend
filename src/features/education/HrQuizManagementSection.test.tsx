import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { HrQuizManagementSection } from './HrQuizManagementSection'
import type {
  HrQuiz,
  HrQuizCreateInput,
} from './hrQuizTypes'

const hrQuizApiMock = vi.hoisted(() => ({
  changeHrQuizActivation: vi.fn(),
  createHrQuiz: vi.fn(),
  fetchHrQuiz: vi.fn(),
  fetchHrQuizzes: vi.fn(),
}))

vi.mock('./hrQuizApi', () => hrQuizApiMock)

vi.mock('./HrQuizForm', () => ({
  HrQuizForm: ({
    onSubmit,
  }: {
    onSubmit: (input: HrQuizCreateInput) => void
  }) => (
    <button
      type="button"
      onClick={() =>
        onSubmit({
          quizTitle: '새 O/X 퀴즈',
          passingScore: 80,
          maxAttemptCount: 3,
          questions: [
            {
              questionContent: '새 문제',
              score: 100,
              correctAnswer: 'O',
            },
          ],
        })
      }
    >
      테스트 퀴즈 저장
    </button>
  ),
}))

;(globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean
}).IS_REACT_ACT_ENVIRONMENT = true

const quiz: HrQuiz = {
  quizId: 201,
  courseId: 101,
  quizTitle: '정보보안 O/X 퀴즈',
  passingScore: 80,
  maxAttemptCount: 3,
  active: true,
  createdBy: 1,
  questions: [
    {
      questionId: 301,
      questionContent:
        '비밀번호를 다른 사람과 공유해도 된다.',
      questionOrder: 1,
      score: 100,
      correctAnswer: 'X',
    },
  ],
}

describe('HrQuizManagementSection', () => {
  let container: HTMLDivElement
  let root: Root | null

  beforeEach(() => {
    Object.values(hrQuizApiMock).forEach((mock) => {
      mock.mockReset()
    })

    hrQuizApiMock.fetchHrQuizzes.mockResolvedValue([])
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount()
      })
    }

    container.remove()
  })

  async function renderSection() {
    await act(async () => {
      root?.render(
        <HrQuizManagementSection courseId={101} />,
      )

      await Promise.resolve()
      await Promise.resolve()
    })
  }

  function buttonWithText(text: string) {
    return [...container.querySelectorAll('button')].find(
      (button) =>
        button.textContent?.trim().includes(text),
    )
  }

  it('loads the quiz list and opens quiz details', async () => {
    hrQuizApiMock.fetchHrQuizzes.mockResolvedValue([quiz])
    hrQuizApiMock.fetchHrQuiz.mockResolvedValue(quiz)

    await renderSection()

    expect(
      hrQuizApiMock.fetchHrQuizzes,
    ).toHaveBeenCalledWith(101)
    expect(container.textContent).toContain(
      '정보보안 O/X 퀴즈',
    )
    expect(container.textContent).toContain('80점')
    expect(container.textContent).toContain('3회')

    const detailButton = buttonWithText('상세 보기')

    if (!detailButton) {
      throw new Error('Detail button was not rendered')
    }

    await act(async () => {
      detailButton.click()
      await Promise.resolve()
    })

    expect(hrQuizApiMock.fetchHrQuiz).toHaveBeenCalledWith(
      101,
      201,
    )
    expect(container.textContent).toContain(
      '비밀번호를 다른 사람과 공유해도 된다.',
    )
    expect(container.textContent).toContain('정답: X')
  })

  it('creates a quiz and adds it to the list', async () => {
    const createdQuiz: HrQuiz = {
      ...quiz,
      quizId: 202,
      quizTitle: '새 O/X 퀴즈',
    }

    hrQuizApiMock.createHrQuiz.mockResolvedValue(
      createdQuiz,
    )

    await renderSection()

    const addButton = buttonWithText('퀴즈 추가')

    if (!addButton) {
      throw new Error('Add quiz button was not rendered')
    }

    await act(async () => {
      addButton.click()
    })

    const saveButton =
      buttonWithText('테스트 퀴즈 저장')

    if (!saveButton) {
      throw new Error('Mock quiz form was not rendered')
    }

    await act(async () => {
      saveButton.click()
      await Promise.resolve()
    })

    expect(hrQuizApiMock.createHrQuiz).toHaveBeenCalledWith(
      101,
      {
        quizTitle: '새 O/X 퀴즈',
        passingScore: 80,
        maxAttemptCount: 3,
        questions: [
          {
            questionContent: '새 문제',
            score: 100,
            correctAnswer: 'O',
          },
        ],
      },
    )
    expect(container.textContent).toContain('새 O/X 퀴즈')
  })

  it('deactivates an active quiz', async () => {
    const deactivatedQuiz: HrQuiz = {
      ...quiz,
      active: false,
    }

    hrQuizApiMock.fetchHrQuizzes.mockResolvedValue([quiz])
    hrQuizApiMock.changeHrQuizActivation.mockResolvedValue(
      deactivatedQuiz,
    )

    await renderSection()

    const activationButton =
      buttonWithText('비활성화')

    if (!activationButton) {
      throw new Error(
        'Quiz activation button was not rendered',
      )
    }

    await act(async () => {
      activationButton.click()
      await Promise.resolve()
    })

    expect(
      hrQuizApiMock.changeHrQuizActivation,
    ).toHaveBeenCalledWith(101, 201, false)
    expect(container.textContent).toContain('비활성')
    expect(buttonWithText('활성화')).toBeDefined()
  })

  it('retries after the quiz list request fails', async () => {
    hrQuizApiMock.fetchHrQuizzes
      .mockRejectedValueOnce(new Error('HTTP 500'))
      .mockResolvedValueOnce([quiz])

    await renderSection()

    expect(container.textContent).toContain(
      '퀴즈 목록을 불러오지 못했습니다.',
    )

    const retryButton = buttonWithText('다시 시도')

    if (!retryButton) {
      throw new Error('Retry button was not rendered')
    }

    await act(async () => {
      retryButton.click()
      await Promise.resolve()
    })

    expect(
      hrQuizApiMock.fetchHrQuizzes,
    ).toHaveBeenCalledTimes(2)
    expect(container.textContent).toContain(
      '정보보안 O/X 퀴즈',
    )
  })
})