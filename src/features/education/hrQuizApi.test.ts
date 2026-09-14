import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../shared/api/httpClient'
import {
  changeHrQuizActivation,
  createHrQuiz,
  fetchHrQuiz,
  fetchHrQuizzes,
} from './hrQuizApi'
import type { HrQuizCreateInput } from './hrQuizTypes'

vi.mock('../../shared/api/httpClient', () => ({
  request: vi.fn(),
}))

const requestMock = vi.mocked(request)

const quizInput: HrQuizCreateInput = {
  quizTitle: '정보보안 O/X 퀴즈',
  passingScore: 80,
  maxAttemptCount: 3,
  questions: [
    {
      questionContent: '비밀번호를 다른 사람과 공유해도 된다.',
      score: 50,
      correctAnswer: 'X',
    },
    {
      questionContent: '의심스러운 이메일의 링크를 확인해야 한다.',
      score: 50,
      correctAnswer: 'O',
    },
  ],
}

describe('hrQuizApi', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('fetches quizzes belonging to a course', async () => {
    requestMock.mockResolvedValueOnce([])

    await fetchHrQuizzes(10)

    expect(requestMock).toHaveBeenCalledWith(
      '/hr/courses/10/quizzes',
    )
  })

  it('fetches one quiz belonging to a course', async () => {
    requestMock.mockResolvedValueOnce({})

    await fetchHrQuiz(10, 20)

    expect(requestMock).toHaveBeenCalledWith(
      '/hr/courses/10/quizzes/20',
    )
  })

  it('creates an O/X quiz with an exact body', async () => {
    requestMock.mockResolvedValueOnce({})

    await createHrQuiz(10, quizInput)

    expect(requestMock).toHaveBeenCalledWith(
      '/hr/courses/10/quizzes',
      {
        method: 'POST',
        body: JSON.stringify(quizInput),
      },
    )
  })

  it('deactivates a quiz with an exact body', async () => {
    requestMock.mockResolvedValueOnce({})

    await changeHrQuizActivation(10, 20, false)

    expect(requestMock).toHaveBeenCalledWith(
      '/hr/courses/10/quizzes/20/activation',
      {
        method: 'PATCH',
        body: JSON.stringify({ active: false }),
      },
    )
  })

  it('activates a quiz with an exact body', async () => {
    requestMock.mockResolvedValueOnce({})

    await changeHrQuizActivation(10, 20, true)

    expect(requestMock).toHaveBeenCalledWith(
      '/hr/courses/10/quizzes/20/activation',
      {
        method: 'PATCH',
        body: JSON.stringify({ active: true }),
      },
    )
  })
})