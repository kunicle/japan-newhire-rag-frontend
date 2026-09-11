export interface SystemErrorEntry {
  systemErrorLogId: number
  appUserId: number | null
  externalApiCallLogId: number | null
  errorSource: string
  errorType: string
  errorCode: string | null
  errorStatus: string
  retryCount: number
  errorMessage: string
  occurredAt: string
  resolvedAt: string | null
}
export interface SystemErrorPage { content: SystemErrorEntry[]; page: number; size: number; totalElements: number; totalPages: number }
