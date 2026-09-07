import { AppError } from '../../shared/api/errors'
import type { NewHireFormValues } from './newHireTypes'

export function validateNewHireForm(form: NewHireFormValues): string | null {
  if (!form.employeeName.trim() || form.employeeName.length > 50) return '이름을 확인해 주세요.'
  if (!form.employeeNumber.trim() || form.employeeNumber.length > 30) return '사번을 확인해 주세요.'
  if (!form.email.trim() || !/^[^@\s]+@[^@\s]+$/.test(form.email) || form.email.length > 100) return '이메일을 확인해 주세요.'
  if (!form.password.trim()) return '비밀번호를 입력해 주세요.'
  if (!form.departmentId) return '부서를 선택해 주세요.'
  if (!form.jobGradeId) return '직급을 선택해 주세요.'
  if (!form.hireDate) return '입사일을 선택해 주세요.'
  return null
}

export function mapNewHireErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    if (error.code === 'EMAIL_ALREADY_EXISTS') return '이미 등록된 이메일입니다.'
    if (error.code === 'EMPLOYEE_NUMBER_ALREADY_EXISTS') return '이미 등록된 사번입니다.'
    if (error.code === 'DEPARTMENT_NOT_AVAILABLE') return '선택한 부서를 사용할 수 없습니다.'
    if (error.code === 'JOB_GRADE_NOT_AVAILABLE') return '선택한 직급을 사용할 수 없습니다.'
    if (error.code === 'ROLE_NOT_AVAILABLE') return '기본 직원 역할을 사용할 수 없습니다. 시스템 관리자에게 문의해 주세요.'
    if (error.code === 'USER_DATA_CONFLICT') return '계정 정보를 저장하지 못했습니다. 입력값을 확인해 주세요.'
    if (error.status === 403) return '신입사원 등록 권한이 없습니다.'
  }
  return '신입사원 계정을 생성하지 못했습니다.'
}
