import { describe, expect, it } from 'vitest'
import { AppError } from '../../shared/api/errors'
import { ADMIN_ROLE_LABELS, hasRemovedRole, mapAdminUserErrorMessage, validateCreateUserForm } from './adminUserHelpers'
import type { CreateUserFormValues } from './adminUserTypes'

const valid: CreateUserFormValues = { email: 'new@example.com', password: 'password', employeeNumber: 'E100', employeeName: '신입', departmentId: '2', jobGradeId: '3', employeeType: 'NEW_HIRE', hireDate: '2026-09-03' }
describe('admin user helpers', () => {
  it.each([
    ['EMAIL_ALREADY_EXISTS', '이미 등록된 이메일입니다.'], ['EMPLOYEE_NUMBER_ALREADY_EXISTS', '이미 등록된 사번입니다.'], ['DEPARTMENT_NOT_AVAILABLE', '선택한 부서를 사용할 수 없습니다.'], ['JOB_GRADE_NOT_AVAILABLE', '선택한 직급을 사용할 수 없습니다.'], ['INVALID_ACCOUNT_STATUS_TRANSITION', '현재 상태에서는 처리할 수 없습니다.'], ['ROLE_NOT_AVAILABLE', '선택한 역할을 사용할 수 없습니다.'], ['USER_DATA_CONFLICT', '요청을 처리하지 못했습니다. 다시 시도해 주세요.'], ['APP_USER_NOT_FOUND', '요청을 처리하지 못했습니다. 다시 시도해 주세요.'],
  ])('maps %s safely', (code, expected) => expect(mapAdminUserErrorMessage(new AppError(409, code, 'raw'))).toBe(expected))
  it('maps forbidden and unknown errors safely', () => { expect(mapAdminUserErrorMessage(new AppError(403, 'DENIED', 'raw'))).toBe('사용자 관리 권한이 없습니다.'); expect(mapAdminUserErrorMessage(new Error('raw'))).toBe('요청을 처리하지 못했습니다.') })
  it('provides role labels', () => expect(ADMIN_ROLE_LABELS).toEqual({ EMPLOYEE: '직원', MANAGER: '관리자', HR_MANAGER: '인사 관리자', SYSTEM_ADMIN: '시스템 관리자' }))
  it.each([
    [{ password: '   ' }, '비밀번호를 입력해 주세요.'], [{ email: 'invalid' }, '이메일을 확인해 주세요.'], [{ email: `${'a'.repeat(95)}@x.com` }, '이메일을 확인해 주세요.'], [{ employeeNumber: 'x'.repeat(31) }, '사번을 확인해 주세요.'], [{ employeeName: '가'.repeat(51) }, '이름을 확인해 주세요.'], [{ departmentId: '' }, '부서를 선택해 주세요.'], [{ jobGradeId: '' }, '직급을 선택해 주세요.'], [{ employeeType: '' }, '직원 유형을 선택해 주세요.'], [{ hireDate: '' }, '입사일을 선택해 주세요.'],
  ] as Array<[Partial<CreateUserFormValues>, string]>)('validates form field %#', (change, expected) => expect(validateCreateUserForm({ ...valid, ...change })).toBe(expected))
  it('accepts a valid form', () => expect(validateCreateUserForm(valid)).toBeNull())
  it('detects role removals but not additions', () => { expect(hasRemovedRole(['EMPLOYEE', 'MANAGER'], ['EMPLOYEE'])).toBe(true); expect(hasRemovedRole(['EMPLOYEE'], ['EMPLOYEE', 'MANAGER'])).toBe(false) })
})
