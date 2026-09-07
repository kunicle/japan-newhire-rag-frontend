import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../shared/api/httpClient'
import { fetchEmployeeCourses, fetchTeamEducation } from './managerEducationApi'

vi.mock('../../shared/api/httpClient', () => ({ request: vi.fn() }))

const requestMock = vi.mocked(request)

describe('managerEducationApi', () => {
  beforeEach(() => requestMock.mockReset())

  it('fetches the default team education page', async () => {
    requestMock.mockResolvedValueOnce({})
    await fetchTeamEducation()
    expect(requestMock).toHaveBeenCalledWith('/manager/team-education?page=0&size=20')
  })

  it('fetches a requested team education page and size', async () => {
    requestMock.mockResolvedValueOnce({})
    await fetchTeamEducation(2, 10)
    expect(requestMock).toHaveBeenCalledWith('/manager/team-education?page=2&size=10')
  })

  it('fetches the default page for one employee', async () => {
    requestMock.mockResolvedValueOnce({})
    await fetchEmployeeCourses(10)
    expect(requestMock).toHaveBeenCalledWith(
      '/manager/employees/10/courses?page=0&size=20',
    )
  })

  it('fetches a requested page and size for one employee', async () => {
    requestMock.mockResolvedValueOnce({})
    await fetchEmployeeCourses(10, 3, 50)
    expect(requestMock).toHaveBeenCalledWith(
      '/manager/employees/10/courses?page=3&size=50',
    )
  })
})
