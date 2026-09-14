import { request } from '../../shared/api/httpClient'
import type {
  QuizAttemptResult,
  QuizAttemptSubmitInput,
  QuizDetail,
} from './quizTypes'

export function fetchQuiz(
  quizId: number,
  enrollmentId: number,
): Promise<QuizDetail> {
  return request<QuizDetail>(
    `/quizzes/${quizId}?enrollmentId=${enrollmentId}`,
  )
}

export function submitQuizAttempt(
  quizId: number,
  input: QuizAttemptSubmitInput,
): Promise<QuizAttemptResult> {
  return request<QuizAttemptResult>(
    `/quizzes/${quizId}/attempts`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}