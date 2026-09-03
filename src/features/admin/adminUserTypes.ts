import type { RoleType } from '../auth/types'

export type EmployeeType = 'NEW_HIRE' | 'GENERAL'
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED'
export interface CreateUserInput { email: string; password: string; employeeNumber: string; employeeName: string; departmentId: number; jobGradeId: number; employeeType: EmployeeType; hireDate: string }
export interface CreateUserResult { appUserId: number; employeeId: number; accountStatus: AccountStatus; employmentStatus: string }
export interface AccountStatusResult { appUserId: number; accountStatus: AccountStatus }
export interface UserRolesResult { appUserId: number; roles: RoleType[] }
export interface CreateUserFormValues { email: string; password: string; employeeNumber: string; employeeName: string; departmentId: string; jobGradeId: string; employeeType: '' | EmployeeType; hireDate: string }
