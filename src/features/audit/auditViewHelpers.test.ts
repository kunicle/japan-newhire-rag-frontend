import { describe, expect, it } from 'vitest'
import { actionLabel, buildAuditLogQuery, parseAuditValue, targetTypeLabel } from './auditViewHelpers'

describe('audit view helpers', () => {
  it('labels known and future actions', () => { expect(actionLabel('USER_CREATED')).toBe('사용자 생성'); expect(actionLabel('FUTURE_ACTION')).toBe('FUTURE_ACTION') })
  it('labels known and future targets', () => { expect(targetTypeLabel('EMPLOYEE')).toBe('직원'); expect(targetTypeLabel('FUTURE_TARGET')).toBe('FUTURE_TARGET') })
  it('parses only JSON objects', () => { expect(parseAuditValue(null)).toBeNull(); expect(parseAuditValue('{"roleType":"EMPLOYEE"}')).toEqual({ roleType: 'EMPLOYEE' }); expect(parseAuditValue('{}')).toEqual({}); expect(parseAuditValue('{bad')).toBeNull(); expect(parseAuditValue('[1,2]')).toBeNull(); expect(parseAuditValue('22')).toBeNull(); expect(parseAuditValue('null')).toBeNull() })
  it('builds page-only query', () => expect(buildAuditLogQuery({}, 0, 20).toString()).toBe('page=0&size=20'))
  it('builds individual filters', () => { expect(buildAuditLogQuery({ actionType: 'ROLE_GRANTED' }, 1, 10).toString()).toBe('actionType=ROLE_GRANTED&page=1&size=10'); expect(buildAuditLogQuery({ actorUserId: 7, targetType: 'APP_USER', targetId: 8 }, 0, 20).toString()).toBe('actorUserId=7&targetType=APP_USER&targetId=8&page=0&size=20') })
  it('builds all filters in contract order', () => expect(buildAuditLogQuery({ actionType: 'DIRECT_MANAGER_CHANGED', actorUserId: 3, targetType: 'EMPLOYEE', targetId: 4, from: '2026-01-01T09:00', to: '2026-01-31T18:00' }, 2, 100).toString()).toBe('actionType=DIRECT_MANAGER_CHANGED&actorUserId=3&targetType=EMPLOYEE&targetId=4&from=2026-01-01T09%3A00&to=2026-01-31T18%3A00&page=2&size=100'))
})
