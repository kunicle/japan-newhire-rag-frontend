import { request } from '../../shared/api/httpClient'
import type { ManagerEducationPage } from './educationTypes'

export function fetchTeamEducation(
  page = 0,
  size = 20,
): Promise<ManagerEducationPage> {
  return request<ManagerEducationPage>(
    `/manager/team-education?page=${page}&size=${size}`,
  )
}

export function fetchEmployeeCourses(
  employeeId: number,
  page = 0,
  size = 20,
): Promise<ManagerEducationPage> {
  return request<ManagerEducationPage>(
    `/manager/employees/${employeeId}/courses?page=${page}&size=${size}`,
  )
}
