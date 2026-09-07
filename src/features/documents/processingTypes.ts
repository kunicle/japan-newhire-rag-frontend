export type ProcessingStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'

export interface DocumentProcessingJob {
  documentProcessingJobId: number
  documentVersionId: number
  status: ProcessingStatus
  failureReason: string | null
  createdAt: string
}
