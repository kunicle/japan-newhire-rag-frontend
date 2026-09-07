import { request } from '../../shared/api/httpClient'
import type { JobGradeReference, OrganizationResponse } from './types'

export function fetchOrganization(): Promise<OrganizationResponse> {
  return request<OrganizationResponse>('/organization')
}

export function fetchJobGrades(): Promise<JobGradeReference[]> {
  return request<JobGradeReference[]>('/organization/job-grades')
}
