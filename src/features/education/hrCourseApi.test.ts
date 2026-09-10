import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../shared/api/httpClient'
import {
  changeCoursePublication,
  changeModuleActivation,
  createCourseEnrollments,
  createHrCourse,
  createHrCourseModule,
  deleteCourseModuleAttachment,
  deleteHrCourse,
  downloadCourseModuleAttachment,
  fetchHrCourse,
  fetchHrCourseModules,
  fetchHrCourses,
  updateHrCourse,
  updateHrCourseModule,
  uploadCourseModuleAttachment,
} from './hrCourseApi'
import type { HrCourseFormInput, HrCourseModuleFormInput } from './hrCourseTypes'

vi.mock('../../shared/api/httpClient', () => ({ request: vi.fn() }))
const requestMock = vi.mocked(request)
const courseInput: HrCourseFormInput = {
  courseName: '과정', courseDescription: '설명', required: true,
  trainingStartDate: '2026-01-01', trainingEndDate: '2026-01-31',
}
const moduleInput: HrCourseModuleFormInput = {
  moduleTitle: '이수 단위', moduleContent: '내용', referenceUrl: '', moduleOrder: 1,
  required: true,
}

describe('hrCourseApi', () => {
  beforeEach(() => requestMock.mockReset())

  it('fetches default and custom course pages', async () => {
    requestMock.mockResolvedValue({})
    await fetchHrCourses()
    await fetchHrCourses(2, 10)
    expect(requestMock).toHaveBeenNthCalledWith(1, '/hr/courses?page=0&size=20')
    expect(requestMock).toHaveBeenNthCalledWith(2, '/hr/courses?page=2&size=10')
  })

  it('fetches one course', async () => {
    requestMock.mockResolvedValueOnce({}); await fetchHrCourse(10)
    expect(requestMock).toHaveBeenCalledWith('/hr/courses/10')
  })

  it('creates a course with an exact body', async () => {
    requestMock.mockResolvedValueOnce({}); await createHrCourse(courseInput)
    expect(requestMock).toHaveBeenCalledWith('/hr/courses', {
      method: 'POST', body: JSON.stringify(courseInput),
    })
  })

  it('updates a course with an exact body', async () => {
    requestMock.mockResolvedValueOnce({}); await updateHrCourse(10, courseInput)
    expect(requestMock).toHaveBeenCalledWith('/hr/courses/10', {
      method: 'PUT', body: JSON.stringify(courseInput),
    })
  })

  it('deletes a course without a body', async () => {
    requestMock.mockResolvedValueOnce(undefined); await deleteHrCourse(10)
    expect(requestMock).toHaveBeenCalledWith('/hr/courses/10', { method: 'DELETE' })
    expect(requestMock.mock.calls[0]?.[1]).not.toHaveProperty('body')
  })

  it('changes publication with an exact body', async () => {
    requestMock.mockResolvedValueOnce({}); await changeCoursePublication(10, 'PUBLIC')
    expect(requestMock).toHaveBeenCalledWith('/hr/courses/10/publication', {
      method: 'PATCH', body: JSON.stringify({ publicationStatus: 'PUBLIC' }),
    })
  })

  it('fetches course modules', async () => {
    requestMock.mockResolvedValueOnce([]); await fetchHrCourseModules(10)
    expect(requestMock).toHaveBeenCalledWith('/hr/courses/10/modules')
  })

  it('creates a module under the course path', async () => {
    requestMock.mockResolvedValueOnce({}); await createHrCourseModule(10, moduleInput)
    expect(requestMock).toHaveBeenCalledWith('/hr/courses/10/modules', {
      method: 'POST', body: JSON.stringify(moduleInput),
    })
  })

  it('updates a module without course ID in the path', async () => {
    requestMock.mockResolvedValueOnce({}); await updateHrCourseModule(5, moduleInput)
    expect(requestMock).toHaveBeenCalledWith('/hr/course-modules/5', {
      method: 'PUT', body: JSON.stringify(moduleInput),
    })
  })

  it('changes module activation without course ID in the path', async () => {
    requestMock.mockResolvedValueOnce({}); await changeModuleActivation(5, false)
    expect(requestMock).toHaveBeenCalledWith('/hr/course-modules/5/activation', {
      method: 'PATCH', body: JSON.stringify({ active: false }),
    })
  })

  it('uploads a TXT attachment as FormData', async () => {
    const file = new File(['attachment'], 'guide.txt', { type: 'text/plain' })
    requestMock.mockResolvedValueOnce({})
    await uploadCourseModuleAttachment(5, file)

    expect(requestMock).toHaveBeenCalledWith(
      '/hr/course-modules/5/attachment',
      expect.objectContaining({ method: 'POST' }),
    )
    const body = requestMock.mock.calls[0]?.[1]?.body
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).get('file')).toBe(file)
  })

  it('downloads an attachment as a Blob', async () => {
    requestMock.mockResolvedValueOnce(new Blob(['attachment']))
    await downloadCourseModuleAttachment(5)
    expect(requestMock).toHaveBeenCalledWith(
      '/course-modules/5/attachment',
      { responseType: 'blob' },
    )
  })

  it('deletes an attachment without a body', async () => {
    requestMock.mockResolvedValueOnce(undefined)
    await deleteCourseModuleAttachment(5)
    expect(requestMock).toHaveBeenCalledWith(
      '/hr/course-modules/5/attachment',
      { method: 'DELETE' },
    )
  })

  it('creates course enrollments with an exact body', async () => {
    const input = {
      targetType: 'DEPARTMENT' as const,
      employeeId: null,
      departmentId: 9,
      jobGradeId: null,
      enrollmentRound: '2026-1',
      enrollmentStartDate: '2026-01-01',
      enrollmentDueDate: '2026-01-31',
    }
    requestMock.mockResolvedValueOnce({})
    await createCourseEnrollments(10, input)
    expect(requestMock).toHaveBeenCalledWith('/hr/courses/10/enrollments', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  })
})
