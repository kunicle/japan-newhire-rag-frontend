import { request } from '../../shared/api/httpClient'
import type {
  LearningProgressUpdateResult,
  MyCourseDetail,
  MyCoursePage,
} from './educationTypes'

export function fetchMyCourses(page = 0, size = 20): Promise<MyCoursePage> {
  return request<MyCoursePage>(`/me/courses?page=${page}&size=${size}`)
}

export function fetchMyCourseDetail(enrollmentId: number): Promise<MyCourseDetail> {
  return request<MyCourseDetail>(`/me/courses/${enrollmentId}`)
}

export function startLearningProgress(
  progressId: number,
): Promise<LearningProgressUpdateResult> {
  return request<LearningProgressUpdateResult>(
    `/me/learning-progress/${progressId}/start`,
    { method: 'PATCH' },
  )
}

export function completeLearningProgress(
  progressId: number,
): Promise<LearningProgressUpdateResult> {
  return request<LearningProgressUpdateResult>(
    `/me/learning-progress/${progressId}/complete`,
    { method: 'PATCH' },
  )
}
