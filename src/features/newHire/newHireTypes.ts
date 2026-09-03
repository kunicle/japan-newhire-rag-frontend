import type { RoleType } from '../auth/types'
import type { AccountStatus } from '../admin/adminUserTypes'

export interface NewHireProvisioningInput { email: string; password: string; employeeNumber: string; employeeName: string; departmentId: number; jobGradeId: number; hireDate: string }
export interface NewHireProvisioningResult { appUserId: number; employeeId: number; accountStatus: AccountStatus; employmentStatus: string; roles: RoleType[] }
export interface NewHireFormValues { email: string; password: string; employeeNumber: string; employeeName: string; departmentId: string; jobGradeId: string; hireDate: string }
export interface NewHireSuccessSummary extends Omit<NewHireProvisioningResult, 'roles'> { email: string; employeeNumber: string; employeeName: string; departmentName: string; jobGradeName: string; roles: RoleType[] }
