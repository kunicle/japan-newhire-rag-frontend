import { request } from '../../shared/api/httpClient'
import type { JobGradeReference, OrganizationResponse } from './types'

export function fetchOrganization(): Promise<OrganizationResponse> {
  return request<OrganizationResponse>('/organization')
}

export function fetchJobGrades(): Promise<JobGradeReference[]> {
  return request<JobGradeReference[]>('/organization/job-grades')
}

export interface EmployeeOrganizationUpdate {
  departmentId: number
  jobGradeId: number
  managerEmployeeId: number | null
}

export interface DepartmentUpdate {
  departmentName: string
  parentDepartmentId: number | null
}

export function updateEmployeeOrganization(employeeId: number, body: EmployeeOrganizationUpdate): Promise<void> {
  return request<void>('/hr/employees/' + employeeId + '/organization', { method: 'PATCH', body: JSON.stringify(body) })
}

export function createDepartment(body: DepartmentUpdate & { departmentCode: string }): Promise<import('./types').OrganizationDepartmentNode> {
  return request('/hr/departments', { method: 'POST', body: JSON.stringify(body) })
}

export function updateDepartment(departmentId: number, body: DepartmentUpdate): Promise<import('./types').OrganizationDepartmentNode> {
  return request('/hr/departments/' + departmentId, { method: 'PATCH', body: JSON.stringify(body) })
}
