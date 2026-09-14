export type OxAnswer = 'O' | 'X'

export interface HrQuizQuestion {
  questionId: number
  questionContent: string
  questionOrder: number
  score: number
  correctAnswer: OxAnswer
}

export interface HrQuiz {
  quizId: number
  courseId: number
  quizTitle: string
  passingScore: number
  maxAttemptCount: number | null
  active: boolean
  createdBy: number
  questions: HrQuizQuestion[]
}

export interface HrQuizQuestionInput {
  questionContent: string
  score: number
  correctAnswer: OxAnswer
}

export interface HrQuizCreateInput {
  quizTitle: string
  passingScore: number
  maxAttemptCount: number
  questions: HrQuizQuestionInput[]
}