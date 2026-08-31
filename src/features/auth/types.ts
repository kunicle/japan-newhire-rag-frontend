export type RoleType =
  | 'EMPLOYEE'
  | 'MANAGER'
  | 'HR_MANAGER'
  | 'SYSTEM_ADMIN'

export type AuthStatus =
  | 'initializing'
  | 'authenticated'
  | 'unauthenticated'

export interface AuthUser {
  appUserId: number
  employeeId: number
  employeeNumber: string
  employeeName: string
  email: string
  departmentId: number
  departmentName: string
  jobGradeId: number
  jobGradeName: string
  jobGradeLevel: number
  roles: RoleType[]
  hireDate: string
  managerEmployeeId: number | null
  managerName: string | null
}

export interface LoginResponse {
  accessToken: string
}
