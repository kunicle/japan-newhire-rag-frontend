import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../shared/api/httpClient'
import { fetchAuditLogs } from './auditApi'

vi.mock('../../shared/api/httpClient', () => ({ request: vi.fn() }))
const requestMock = vi.mocked(request)
describe('auditApi', () => {
  beforeEach(() => requestMock.mockReset().mockResolvedValue({}))
  it('fetches page and size without filters', async () => { await fetchAuditLogs({}, 0, 20); expect(requestMock).toHaveBeenCalledWith('/admin/audit-logs?page=0&size=20') })
  it('fetches individual filters', async () => { await fetchAuditLogs({ actorUserId: 9 }, 1, 10); expect(requestMock).toHaveBeenCalledWith('/admin/audit-logs?actorUserId=9&page=1&size=10') })
  it('fetches all filters exactly', async () => { await fetchAuditLogs({ actionType: 'ROLE_REVOKED', actorUserId: 1, targetType: 'USER_ROLE', targetId: 2, from: '2026-02-01T09:00', to: '2026-02-02T18:00' }, 3, 100); expect(requestMock).toHaveBeenCalledWith('/admin/audit-logs?actionType=ROLE_REVOKED&actorUserId=1&targetType=USER_ROLE&targetId=2&from=2026-02-01T09%3A00&to=2026-02-02T18%3A00&page=3&size=100') })
})
