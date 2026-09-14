import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../shared/api/httpClient'
import { fetchQuiz, submitQuizAttempt } from './quizApi'
import type { QuizAttemptSubmitInput } from './quizTypes'

vi.mock('../../shared/api/httpClient', () => ({
  request: vi.fn(),
}))

const requestMock = vi.mocked(request)

const attemptInput: QuizAttemptSubmitInput = {
  enrollmentId: 11,
  answers: [
    {
      questionId: 101,
      optionId: 1002,
    },
    {
      questionId: 102,
      optionId: 1003,
    },
  ],
}

describe('quizApi', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('fetches a quiz for an enrollment', async () => {
    requestMock.mockResolvedValueOnce({})

    await fetchQuiz(20, 11)

    expect(requestMock).toHaveBeenCalledWith(
      '/quizzes/20?enrollmentId=11',
    )
  })

  it('submits every selected answer', async () => {
    requestMock.mockResolvedValueOnce({})

    await submitQuizAttempt(20, attemptInput)

    expect(requestMock).toHaveBeenCalledWith(
      '/quizzes/20/attempts',
      {
        method: 'POST',
        body: JSON.stringify(attemptInput),
      },
    )
  })
})