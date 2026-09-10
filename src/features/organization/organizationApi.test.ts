import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../shared/api/httpClient'
import { fetchJobGrades, fetchOrganization, updateEmployeeOrganization, createDepartment, updateDepartment } from './organizationApi'

vi.mock('../../shared/api/httpClient', () => ({ request: vi.fn() }))

const requestMock = vi.mocked(request)

describe('organizationApi', () => {
  beforeEach(() => requestMock.mockReset())

  it('fetches the organization', async () => {
    requestMock.mockResolvedValueOnce({ departments: [] })
    await fetchOrganization()
    expect(requestMock).toHaveBeenCalledWith('/organization')
  })

  it('fetches job grades', async () => {
    requestMock.mockResolvedValueOnce([])
    await fetchJobGrades()
    expect(requestMock).toHaveBeenCalledWith('/organization/job-grades')
  })
})

describe('HR organization mutations', () => {
  it('sends explicit null to remove a manager', async () => {
    const body = { departmentId: 1, jobGradeId: 2, managerEmployeeId: null }
    await updateEmployeeOrganization(10, body)
    expect(requestMock).toHaveBeenLastCalledWith('/hr/employees/10/organization', { method: 'PATCH', body: JSON.stringify(body) })
  })
  it('uses department create and update endpoints', async () => {
    await createDepartment({ departmentCode: 'DEV', departmentName: 'Development', parentDepartmentId: null })
    expect(requestMock).toHaveBeenLastCalledWith('/hr/departments', expect.objectContaining({ method: 'POST' }))
    await updateDepartment(1, { departmentName: 'Renamed', parentDepartmentId: null })
    expect(requestMock).toHaveBeenLastCalledWith('/hr/departments/1', expect.objectContaining({ method: 'PATCH' }))
  })
})
