import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QuizTakingSection } from './QuizTakingSection'
import type {
  QuizAttemptResult,
  QuizDetail,
} from './quizTypes'

const quizApiMock = vi.hoisted(() => ({
  fetchQuiz: vi.fn(),
  submitQuizAttempt: vi.fn(),
}))

vi.mock('./quizApi', () => quizApiMock)

;(globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean
}).IS_REACT_ACT_ENVIRONMENT = true

const quiz: QuizDetail = {
  quizId: 501,
  courseId: 101,
  courseModuleId: null,
  quizTitle: '정보보안 확인 퀴즈',
  passingScore: 80,
  maxAttemptCount: 3,
  attemptsUsed: 0,
  questions: [
    {
      questionId: 601,
      questionContent: '비밀번호를 공유해도 된다.',
      questionOrder: 1,
      score: 50,
      options: [
        { optionId: 701, optionContent: 'O', optionOrder: 1 },
        { optionId: 702, optionContent: 'X', optionOrder: 2 },
      ],
    },
    {
      questionId: 602,
      questionContent: '의심스러운 링크를 확인해야 한다.',
      questionOrder: 2,
      score: 50,
      options: [
        { optionId: 703, optionContent: 'O', optionOrder: 1 },
        { optionId: 704, optionContent: 'X', optionOrder: 2 },
      ],
    },
  ],
}

const result: QuizAttemptResult = {
  attemptId: 801,
  attemptNumber: 1,
  totalScore: 100,
  passed: true,
  attemptStatus: 'GRADED',
  remainingAttemptCount: 2,
  submittedAt: '2026-09-14T15:00:00+09:00',
}

const exhaustedQuiz: QuizDetail = {
  ...quiz,
  attemptsUsed: 3,
  latestAttemptReview: {
    attemptId: 803,
    attemptNumber: 3,
    totalScore: 0,
    passed: false,
    remainingAttemptCount: 0,
    submittedAt: '2026-09-15T10:30:00+09:00',
    questions: [
      {
        questionId: 601,
        questionContent: '비밀번호를 공유해도 된다.',
        questionOrder: 1,
        score: 50,
        selectedOptionId: 701,
        selectedOptionContent: 'O',
        correctOptionId: 702,
        correctOptionContent: 'X',
        correct: false,
        earnedScore: 0,
      },
    ],
  },
}

describe('QuizTakingSection', () => {
  let container: HTMLDivElement
  let root: Root | null

  beforeEach(() => {
    quizApiMock.fetchQuiz.mockReset()
    quizApiMock.submitQuizAttempt.mockReset()
    quizApiMock.fetchQuiz.mockResolvedValue(quiz)
    quizApiMock.submitQuizAttempt.mockResolvedValue(result)

    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    if (root) {
      await act(async () => root?.unmount())
    }
    container.remove()
  })

  function buttonWithText(text: string) {
    return [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes(text))
  }

  it('loads a stored quiz, submits answers, and displays the result', async () => {
    await act(async () => {
      root?.render(
        <QuizTakingSection
          enrollmentId={11}
          quizzes={[
            {
              quizId: quiz.quizId,
              quizTitle: quiz.quizTitle,
            },
          ]}
        />,
      )
    })

    await act(async () => {
      buttonWithText(quiz.quizTitle)?.click()
    })

    expect(quizApiMock.fetchQuiz).toHaveBeenCalledWith(501, 11)

    const radios = container.querySelectorAll<HTMLInputElement>(
      'input[type="radio"]',
    )

    await act(async () => {
      radios[1].click()
      radios[2].click()
    })

    await act(async () => {
      buttonWithText('답안 제출')?.click()
    })

    expect(quizApiMock.submitQuizAttempt).toHaveBeenCalledWith(
      501,
      {
        enrollmentId: 11,
        answers: [
          { questionId: 601, optionId: 702 },
          { questionId: 602, optionId: 703 },
        ],
      },
    )

    expect(container.textContent).toContain('퀴즈에 합격했습니다.')
    expect(container.textContent).toContain('100점')
    expect(container.textContent).toContain('1회차')
  })
  it('shows the stored final answers after attempts are exhausted', async () => {
    quizApiMock.fetchQuiz.mockResolvedValue(exhaustedQuiz)

    await act(async () => {
      root?.render(
        <QuizTakingSection
          enrollmentId={11}
          quizzes={[
            {
              quizId: quiz.quizId,
              quizTitle: quiz.quizTitle,
            },
          ]}
        />,
      )
    })

    await act(async () => {
      buttonWithText(quiz.quizTitle)?.click()
    })

    expect(container.textContent).toContain(
      '최종 응시에서 합격 점수에 도달하지 못했습니다.',
    )
    expect(container.textContent).toContain(
      '최대 응시 횟수를 모두 사용했습니다.',
    )
    expect(container.textContent).toContain(
      '최종 응시 답안 및 정답',
    )
    expect(container.textContent).toContain(
      '비밀번호를 공유해도 된다.',
    )
    expect(container.textContent).toContain('내가 선택한 답')
    expect(container.textContent).toContain('정답')
    expect(container.textContent).toContain('오답')
    expect(container.textContent).toContain('O')
    expect(container.textContent).toContain('X')
    expect(
      container.querySelectorAll('input[type="radio"]'),
    ).toHaveLength(0)
    expect(buttonWithText('답안 제출')).toBeUndefined()
  })

  it('reloads and shows the review immediately after the final attempt', async () => {
    const finalResult: QuizAttemptResult = {
      ...result,
      attemptId: 803,
      attemptNumber: 3,
      totalScore: 0,
      passed: false,
      remainingAttemptCount: 0,
    }

    quizApiMock.fetchQuiz
      .mockResolvedValueOnce(quiz)
      .mockResolvedValueOnce(exhaustedQuiz)
    quizApiMock.submitQuizAttempt.mockResolvedValue(finalResult)

    await act(async () => {
      root?.render(
        <QuizTakingSection
          enrollmentId={11}
          quizzes={[
            {
              quizId: quiz.quizId,
              quizTitle: quiz.quizTitle,
            },
          ]}
        />,
      )
    })

    await act(async () => {
      buttonWithText(quiz.quizTitle)?.click()
    })

    const radios = container.querySelectorAll<HTMLInputElement>(
      'input[type="radio"]',
    )

    await act(async () => {
      radios[0].click()
      radios[2].click()
    })

    await act(async () => {
      buttonWithText('답안 제출')?.click()
    })

    expect(quizApiMock.submitQuizAttempt).toHaveBeenCalledOnce()
    expect(quizApiMock.fetchQuiz).toHaveBeenCalledTimes(2)
    expect(quizApiMock.fetchQuiz).toHaveBeenLastCalledWith(
      501,
      11,
    )
    expect(container.textContent).toContain(
      '최종 응시 답안 및 정답',
    )
    expect(container.textContent).toContain('내가 선택한 답')
    expect(container.textContent).toContain('오답')
    expect(container.textContent).toContain(
      '비밀번호를 공유해도 된다.',
    )
    expect(buttonWithText('답안 제출')).toBeUndefined()
  })

})