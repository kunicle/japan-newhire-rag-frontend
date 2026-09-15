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

export interface QuizQuestionReview {
  questionId: number
  questionContent: string
  questionOrder: number
  score: number
  selectedOptionId: number
  selectedOptionContent: string
  correctOptionId: number
  correctOptionContent: string
  correct: boolean
  earnedScore: number
}

export interface QuizAttemptReview {
  attemptId: number
  attemptNumber: number
  totalScore: number
  passed: boolean
  remainingAttemptCount: number | null
  submittedAt: string
  questions: QuizQuestionReview[]
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
  latestAttemptReview?: QuizAttemptReview | null
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