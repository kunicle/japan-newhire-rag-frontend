export type EnrollmentStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'OVERDUE'

export type LearningCompletionStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'

export interface MyCourseSummary {
  enrollmentId: number
  courseId: number
  courseName: string
  required: boolean
  enrollmentDueDate: string
  progressRate: number
  status: EnrollmentStatus
}

export interface MyCoursePage {
  content: MyCourseSummary[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface MyCourseModule {
  progressId: number
  moduleId: number
  moduleTitle: string
  moduleContent: string | null
  referenceUrl: string | null
  moduleOrder: number
  required: boolean
  completionStatus: LearningCompletionStatus
  startedAt: string | null
  completedAt: string | null
}

export interface MyCourseDetail {
  enrollmentId: number
  courseId: number
  courseName: string
  courseDescription: string
  required: boolean
  enrollmentRound: string
  enrollmentStartDate: string
  enrollmentDueDate: string
  progressRate: number
  status: EnrollmentStatus
  completedAt: string | null
  modules: MyCourseModule[]
}

export interface LearningProgressUpdateResult {
  progressId: number
  enrollmentId: number
  moduleId: number
  completionStatus: LearningCompletionStatus
  startedAt: string | null
  completedAt: string | null
  progressRate: number
  enrollmentStatus: EnrollmentStatus
}
