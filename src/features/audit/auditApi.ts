import { request } from '../../shared/api/httpClient'
import { buildAuditLogQuery } from './auditViewHelpers'
import type { AuditLogFilters, AuditLogPage } from './types'

export function fetchAuditLogs(filters: AuditLogFilters, page: number, size: number): Promise<AuditLogPage> {
  return request<AuditLogPage>(`/admin/audit-logs?${buildAuditLogQuery(filters, page, size).toString()}`)
}
