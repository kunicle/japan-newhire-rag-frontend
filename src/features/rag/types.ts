export type RagQuestionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'ANSWERED'
  | 'REJECTED'
  | 'FAILED'

export type RagAnswerStatus = 'ANSWERED' | 'INSUFFICIENT_EVIDENCE'

export interface RagCitation {
  documentChunkId: number
  documentName: string
  versionName: string
  articleNumber: string
  citedText: string
}

export interface RagQueryResult {
  status: RagAnswerStatus
  answer: string | null
  validCitedChunkIds: number[]
  citations: RagCitation[]
}

export interface RagHistoryItem {
  questionId: number
  question: string
  status: RagQuestionStatus
  askedAt: string
}

export interface RagHistoryDetail extends RagHistoryItem {
  answer: string | null
  citations: RagCitation[]
  failureType: string | null
  failureReason: string | null
}

export interface RagHistoryPage {
  content: RagHistoryItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
