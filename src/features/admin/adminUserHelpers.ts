import { AppError } from '../../shared/api/errors'
import type { RoleType } from '../auth/types'
import type { CreateUserFormValues } from './adminUserTypes'

export const ADMIN_ROLE_LABELS: Record<RoleType, string> = { EMPLOYEE: '직원', MANAGER: '관리자', HR_MANAGER: '인사 관리자', SYSTEM_ADMIN: '시스템 관리자' }
export function mapAdminUserErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    if (error.code === 'EMAIL_ALREADY_EXISTS') return '이미 등록된 이메일입니다.'
    if (error.code === 'EMPLOYEE_NUMBER_ALREADY_EXISTS') return '이미 등록된 사번입니다.'
    if (error.code === 'DEPARTMENT_NOT_AVAILABLE') return '선택한 부서를 사용할 수 없습니다.'
    if (error.code === 'JOB_GRADE_NOT_AVAILABLE') return '선택한 직급을 사용할 수 없습니다.'
    if (error.code === 'INVALID_ACCOUNT_STATUS_TRANSITION') return '현재 상태에서는 처리할 수 없습니다.'
    if (error.code === 'ROLE_NOT_AVAILABLE') return '선택한 역할을 사용할 수 없습니다.'
    if (error.code === 'USER_DATA_CONFLICT' || error.code === 'APP_USER_NOT_FOUND') return '요청을 처리하지 못했습니다. 다시 시도해 주세요.'
    if (error.status === 403) return '사용자 관리 권한이 없습니다.'
  }
  return '요청을 처리하지 못했습니다.'
}
export function validateCreateUserForm(form: CreateUserFormValues): string | null {
  if (!form.email.trim() || !/^[^@\s]+@[^@\s]+$/.test(form.email) || form.email.length > 100) return '이메일을 확인해 주세요.'
  if (!form.password.trim()) return '비밀번호를 입력해 주세요.'
  if (!form.employeeNumber.trim() || form.employeeNumber.length > 30) return '사번을 확인해 주세요.'
  if (!form.employeeName.trim() || form.employeeName.length > 50) return '이름을 확인해 주세요.'
  if (!form.departmentId) return '부서를 선택해 주세요.'
  if (!form.jobGradeId) return '직급을 선택해 주세요.'
  if (!form.employeeType) return '직원 유형을 선택해 주세요.'
  if (!form.hireDate) return '입사일을 선택해 주세요.'
  return null
}
export function hasRemovedRole(currentRoles: RoleType[], desiredRoles: RoleType[]): boolean { return currentRoles.some((role) => !desiredRoles.includes(role)) }
