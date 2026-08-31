import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../shared/api/httpClient'
import { fetchJobGrades, fetchOrganization } from './organizationApi'

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
