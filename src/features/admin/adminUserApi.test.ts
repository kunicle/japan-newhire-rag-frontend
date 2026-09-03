import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../shared/api/httpClient'
import { activateUser, createUser, deactivateUser, updateUserRoles } from './adminUserApi'

vi.mock('../../shared/api/httpClient', () => ({ request: vi.fn() }))
const requestMock = vi.mocked(request)
const input = { email: 'new@example.com', password: 'password', employeeNumber: 'E100', employeeName: '신입', departmentId: 2, jobGradeId: 3, employeeType: 'NEW_HIRE' as const, hireDate: '2026-09-03' }
describe('adminUserApi', () => {
  beforeEach(() => requestMock.mockReset().mockResolvedValue({}))
  it('creates a user', async () => { await createUser(input); expect(requestMock).toHaveBeenCalledWith('/admin/users', { method: 'POST', body: JSON.stringify(input) }) })
  it('activates a user', async () => { await activateUser(11); expect(requestMock).toHaveBeenCalledWith('/admin/users/11/activate', { method: 'PATCH' }) })
  it('deactivates a user', async () => { await deactivateUser(11); expect(requestMock).toHaveBeenCalledWith('/admin/users/11/deactivate', { method: 'PATCH' }) })
  it('replaces user roles', async () => { await updateUserRoles(11, ['EMPLOYEE', 'MANAGER']); expect(requestMock).toHaveBeenCalledWith('/admin/users/11/roles', { method: 'PATCH', body: JSON.stringify({ roles: ['EMPLOYEE', 'MANAGER'] }) }) })
})
