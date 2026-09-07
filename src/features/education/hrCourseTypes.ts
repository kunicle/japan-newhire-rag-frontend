export type CoursePublicationStatus = 'DRAFT' | 'PUBLIC' | 'PRIVATE'

export interface HrCourse {
  courseId: number
  courseName: string
  courseDescription: string
  required: boolean
  trainingStartDate: string
  trainingEndDate: string
  publicationStatus: CoursePublicationStatus
  createdBy: number
  createdAt: string
  updatedAt: string
}

export interface HrCoursePage {
  content: HrCourse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface HrCourseFormInput {
  courseName: string
  courseDescription: string
  required: boolean
  trainingStartDate: string
  trainingEndDate: string
}

export interface HrCourseModule {
  courseModuleId: number
  courseId: number
  moduleTitle: string
  moduleContent: string | null
  referenceUrl: string | null
  moduleOrder: number
  required: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface HrCourseModuleFormInput {
  moduleTitle: string
  moduleContent: string
  referenceUrl: string
  moduleOrder: number
  required: boolean
}

export type AssignmentTargetType =
  | 'EMPLOYEE'
  | 'DEPARTMENT'
  | 'JOB_GRADE'
  | 'NEW_HIRE'

export interface CourseEnrollmentCreateInput {
  targetType: AssignmentTargetType
  employeeId: number | null
  departmentId: number | null
  jobGradeId: number | null
  enrollmentRound: string
  enrollmentStartDate: string
  enrollmentDueDate: string
}

export interface CourseEnrollmentCreateResult {
  assignedCount: number
  duplicateCount: number
  duplicateEmployeeIds: number[]
}
