export type AuditActionType = 'USER_CREATED' | 'ACCOUNT_ACTIVATED' | 'ACCOUNT_DEACTIVATED' | 'ROLE_GRANTED' | 'ROLE_REVOKED' | 'DIRECT_MANAGER_CHANGED' | 'EVALUATION_RESULT_PUBLISHED'
export type AuditTargetType = 'APP_USER' | 'USER_ROLE' | 'EMPLOYEE' | 'EVALUATION'
export interface AuditLogEntry { auditLogId: number; actorUserId: number; actionType: AuditActionType; targetType: AuditTargetType; targetId: number; previousValue: string | null; changedValue: string | null; requestIp: string | null; requestId: string | null; createdAt: string }
export interface AuditLogPage { content: AuditLogEntry[]; page: number; size: number; totalElements: number; totalPages: number }
export interface AuditLogFilters { actionType?: AuditActionType; actorUserId?: number; targetType?: AuditTargetType; targetId?: number; from?: string; to?: string }
