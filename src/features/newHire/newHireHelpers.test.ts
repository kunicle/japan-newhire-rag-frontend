import { describe, expect, it } from 'vitest'
import { AppError } from '../../shared/api/errors'
import { mapNewHireErrorMessage, validateNewHireForm } from './newHireHelpers'
import type { NewHireFormValues } from './newHireTypes'

const valid: NewHireFormValues = { employeeName: '신입', employeeNumber: 'E100', email: 'new@example.com', password: 'password', departmentId: '2', jobGradeId: '3', hireDate: '2026-09-03' }

describe('new hire helpers', () => {
  it.each([
    [{ employeeName: '' }, '이름을 확인해 주세요.'],
    [{ employeeNumber: '' }, '사번을 확인해 주세요.'],
    [{ email: 'invalid' }, '이메일을 확인해 주세요.'],
    [{ password: ' ' }, '비밀번호를 입력해 주세요.'],
    [{ departmentId: '' }, '부서를 선택해 주세요.'],
    [{ jobGradeId: '' }, '직급을 선택해 주세요.'],
    [{ hireDate: '' }, '입사일을 선택해 주세요.'],
  ] as Array<[Partial<NewHireFormValues>, string]>)('validates field %#', (change, expected) => {
    expect(validateNewHireForm({ ...valid, ...change })).toBe(expected)
  })

  it('accepts a valid form', () => expect(validateNewHireForm(valid)).toBeNull())

  it.each([
    ['EMAIL_ALREADY_EXISTS', '이미 등록된 이메일입니다.'],
    ['EMPLOYEE_NUMBER_ALREADY_EXISTS', '이미 등록된 사번입니다.'],
    ['DEPARTMENT_NOT_AVAILABLE', '선택한 부서를 사용할 수 없습니다.'],
    ['JOB_GRADE_NOT_AVAILABLE', '선택한 직급을 사용할 수 없습니다.'],
    ['ROLE_NOT_AVAILABLE', '기본 직원 역할을 사용할 수 없습니다. 시스템 관리자에게 문의해 주세요.'],
    ['USER_DATA_CONFLICT', '계정 정보를 저장하지 못했습니다. 입력값을 확인해 주세요.'],
  ])('maps %s safely', (code, expected) => {
    expect(mapNewHireErrorMessage(new AppError(409, code, 'raw'))).toBe(expected)
  })

  it('maps forbidden and unknown errors safely', () => {
    expect(mapNewHireErrorMessage(new AppError(403, 'FORBIDDEN', 'raw'))).toBe('신입사원 등록 권한이 없습니다.')
    expect(mapNewHireErrorMessage(new Error('raw'))).toBe('신입사원 계정을 생성하지 못했습니다.')
  })
})
