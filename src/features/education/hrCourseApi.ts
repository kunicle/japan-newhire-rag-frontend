import { request } from '../../shared/api/httpClient'
import type {
  CourseEnrollmentCreateInput,
  CourseEnrollmentCreateResult,
  CoursePublicationStatus,
  HrCourse,
  HrCourseFormInput,
  HrCourseModule,
  HrCourseModuleFormInput,
  HrCoursePage,
} from './hrCourseTypes'

export function createCourseEnrollments(
  courseId: number,
  input: CourseEnrollmentCreateInput,
): Promise<CourseEnrollmentCreateResult> {
  return request<CourseEnrollmentCreateResult>(`/hr/courses/${courseId}/enrollments`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function fetchHrCourses(page = 0, size = 20): Promise<HrCoursePage> {
  return request<HrCoursePage>(`/hr/courses?page=${page}&size=${size}`)
}

export function fetchHrCourse(courseId: number): Promise<HrCourse> {
  return request<HrCourse>(`/hr/courses/${courseId}`)
}

export function createHrCourse(input: HrCourseFormInput): Promise<HrCourse> {
  return request<HrCourse>('/hr/courses', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateHrCourse(
  courseId: number,
  input: HrCourseFormInput,
): Promise<HrCourse> {
  return request<HrCourse>(`/hr/courses/${courseId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteHrCourse(courseId: number): Promise<void> {
  return request<void>(`/hr/courses/${courseId}`, { method: 'DELETE' })
}

export function changeCoursePublication(
  courseId: number,
  publicationStatus: CoursePublicationStatus,
): Promise<HrCourse> {
  return request<HrCourse>(`/hr/courses/${courseId}/publication`, {
    method: 'PATCH',
    body: JSON.stringify({ publicationStatus }),
  })
}

export function fetchHrCourseModules(courseId: number): Promise<HrCourseModule[]> {
  return request<HrCourseModule[]>(`/hr/courses/${courseId}/modules`)
}

export function createHrCourseModule(
  courseId: number,
  input: HrCourseModuleFormInput,
): Promise<HrCourseModule> {
  return request<HrCourseModule>(`/hr/courses/${courseId}/modules`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateHrCourseModule(
  moduleId: number,
  input: HrCourseModuleFormInput,
): Promise<HrCourseModule> {
  return request<HrCourseModule>(`/hr/course-modules/${moduleId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function changeModuleActivation(
  moduleId: number,
  active: boolean,
): Promise<HrCourseModule> {
  return request<HrCourseModule>(`/hr/course-modules/${moduleId}/activation`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  })
}
