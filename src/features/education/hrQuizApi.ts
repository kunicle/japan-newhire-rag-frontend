import { request } from '../../shared/api/httpClient'
import type { HrQuiz, HrQuizCreateInput } from './hrQuizTypes'

export function fetchHrQuizzes(courseId: number): Promise<HrQuiz[]> {
  return request<HrQuiz[]>(`/hr/courses/${courseId}/quizzes`)
}

export function fetchHrQuiz(
  courseId: number,
  quizId: number,
): Promise<HrQuiz> {
  return request<HrQuiz>(
    `/hr/courses/${courseId}/quizzes/${quizId}`,
  )
}

export function createHrQuiz(
  courseId: number,
  input: HrQuizCreateInput,
): Promise<HrQuiz> {
  return request<HrQuiz>(`/hr/courses/${courseId}/quizzes`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function changeHrQuizActivation(
  courseId: number,
  quizId: number,
  active: boolean,
): Promise<HrQuiz> {
  return request<HrQuiz>(
    `/hr/courses/${courseId}/quizzes/${quizId}/activation`,
    {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    },
  )
}