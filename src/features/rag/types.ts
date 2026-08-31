export type RagQuestionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'ANSWERED'
  | 'REJECTED'
  | 'FAILED'

export interface RagCitation {
  documentChunkId: number
  documentName: string
  versionName: string
  articleNumber: string
  citedText: string
}

export interface RagQueryResult {
  hasSufficientEvidence: boolean
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
}
