export interface OrganizationDepartmentNode {
  departmentId: number
  departmentCode: string
  departmentName: string
  parentDepartmentId: number | null
  displayOrder: number
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
