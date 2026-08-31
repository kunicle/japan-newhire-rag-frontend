import { request } from '../../shared/api/httpClient'
import type { DocumentProcessingJob } from './processingTypes'

export function fetchDocumentProcessingJobs(): Promise<
  DocumentProcessingJob[]
> {
  return request<DocumentProcessingJob[]>('/hr/document-processing-jobs')
}

export function retryDocumentProcessingJob(
  jobId: number,
): Promise<DocumentProcessingJob> {
  return request<DocumentProcessingJob>(
    `/hr/document-processing-jobs/${jobId}/retry`,
    { method: 'POST' },
  )
}
