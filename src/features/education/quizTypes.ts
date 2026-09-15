export type QuizAttemptStatus =
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'GRADED'

export interface QuizOption {
  optionId: number
  optionContent: string
  optionOrder: number
}

export interface QuizQuestion {
  questionId: number
  questionContent: string
  questionOrder: number
  score: number
  options: QuizOption[]
}

export interface QuizDetail {
  quizId: number
  courseId: number
  courseModuleId: number | null
  quizTitle: string
  passingScore: number
  maxAttemptCount: number | null
  required?: boolean
  attemptsUsed: number
  questions: QuizQuestion[]
}

export interface QuizAnswerInput {
  questionId: number
  optionId: number
}

export interface QuizAttemptSubmitInput {
  enrollmentId: number
  answers: QuizAnswerInput[]
}

export interface QuizAttemptResult {
  attemptId: number
  attemptNumber: number
  totalScore: number
  passed: boolean
  attemptStatus: QuizAttemptStatus
  remainingAttemptCount: number | null
  submittedAt: string
}