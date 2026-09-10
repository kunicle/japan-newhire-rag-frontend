export interface OrganizationEmployee {
  employeeId: number
  employeeNumber: string
  employeeName: string
  departmentId: number
  jobGradeId: number | null
  jobGradeName: string | null
  jobGradeLevel: number | null
  hireDate: string
  departmentName?: string
  managerEmployeeId?: number | null
}

export interface OrganizationDepartmentNode {
  departmentId: number
  departmentCode: string
  departmentName: string
  parentDepartmentId: number | null
  displayOrder: number
  employees: OrganizationEmployee[]
  children: OrganizationDepartmentNode[]
}

export interface OrganizationResponse {
  departments: OrganizationDepartmentNode[]
}

export interface JobGradeReference {
  jobGradeId: number
  jobGradeCode: string
  jobGradeName: string
  jobGradeLevel: number
}
