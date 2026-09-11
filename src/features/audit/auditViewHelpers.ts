import type { AuditLogFilters } from './types'

const ACTION_LABELS: Record<string, string> = {
  EMPLOYEE_DEPARTMENT_CHANGED: '직원 부서 변경', EMPLOYEE_JOB_GRADE_CHANGED: '직원 직급 변경', DEPARTMENT_CREATED: '부서 생성', DEPARTMENT_UPDATED: '부서 정보 수정',
  USER_CREATED: '사용자 생성', ACCOUNT_ACTIVATED: '계정 활성화', ACCOUNT_DEACTIVATED: '계정 비활성화', ROLE_GRANTED: '역할 부여', ROLE_REVOKED: '역할 회수', DIRECT_MANAGER_CHANGED: '직속 관리자 변경',
  DOCUMENT_VERSION_RETRACTED: '문서 버전 철회', DOCUMENT_VERSION_PUBLISHED: '문서 버전 공개', DOCUMENT_ACCESS_RULE_CHANGED: '문서 접근 조건 변경', EVALUATION_RESULT_PUBLISHED: '평가 결과 발행',
}
const TARGET_LABELS: Record<string, string> = { DEPARTMENT: '부서', APP_USER: '사용자', USER_ROLE: '사용자 역할', EMPLOYEE: '직원', EVALUATION: '평가', DOCUMENT_VERSION: '문서 버전' }

export function actionLabel(actionType: string): string { return ACTION_LABELS[actionType] ?? actionType }
export function targetTypeLabel(targetType: string): string { return TARGET_LABELS[targetType] ?? targetType }
export function buildAuditLogQuery(filters: AuditLogFilters, page: number, size: number): URLSearchParams {
  const query = new URLSearchParams()
  if (filters.actionType) query.set('actionType', filters.actionType)
  if (filters.actorUserId != null) query.set('actorUserId', String(filters.actorUserId))
  if (filters.targetType) query.set('targetType', filters.targetType)
  if (filters.targetId != null) query.set('targetId', String(filters.targetId))
  if (filters.from) query.set('from', filters.from)
  if (filters.to) query.set('to', filters.to)
  query.set('page', String(page)); query.set('size', String(size))
  return query
}
export function parseAuditValue(value: string | null): Record<string, unknown> | null {
  if (value === null) return null
  try { const parsed: unknown = JSON.parse(value); return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null } catch { return null }
}
