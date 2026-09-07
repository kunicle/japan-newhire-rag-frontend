import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../shared/api/httpClient'
import { provisionNewHire } from './newHireApi'

vi.mock('../../shared/api/httpClient', () => ({ request: vi.fn() }))
const requestMock = vi.mocked(request)

describe('newHireApi', () => {
  beforeEach(() => requestMock.mockReset().mockResolvedValue({}))

  it('posts the narrow provisioning body without employeeType or roles', async () => {
    const input = { email: 'new@example.com', password: 'password', employeeNumber: 'E100', employeeName: '신입', departmentId: 2, jobGradeId: 3, hireDate: '2026-09-03' }
    await provisionNewHire(input)
    expect(requestMock).toHaveBeenCalledWith('/hr/new-hires', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    const body = JSON.parse(requestMock.mock.calls[0][1]?.body as string)
    expect(body).not.toHaveProperty('employeeType')
    expect(body).not.toHaveProperty('roles')
  })
})
