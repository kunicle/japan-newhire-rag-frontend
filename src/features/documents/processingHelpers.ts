import type { BadgeProps } from '../../shared/ui'
import type {
  DocumentProcessingJob,
  ProcessingStatus,
} from './processingTypes'

export function computeLatestJobIdByVersion(
  jobs: DocumentProcessingJob[],
): Map<number, number> {
  const latestJobs = new Map<number, DocumentProcessingJob>()

  for (const job of jobs) {
    const current = latestJobs.get(job.documentVersionId)
    if (
      !current ||
      job.createdAt > current.createdAt ||
      (job.createdAt === current.createdAt &&
        job.documentProcessingJobId > current.documentProcessingJobId)
    ) {
      latestJobs.set(job.documentVersionId, job)
    }
  }

  return new Map(
    [...latestJobs].map(([versionId, job]) => [
      versionId,
      job.documentProcessingJobId,
    ]),
  )
}

export function isRetryEligible(
  job: DocumentProcessingJob,
  latestJobIdByVersion: Map<number, number>,
): boolean {
  return (
    job.status === 'FAILED' &&
    latestJobIdByVersion.get(job.documentVersionId) ===
      job.documentProcessingJobId
  )
}

export function isSupersededFailure(
  job: DocumentProcessingJob,
  latestJobIdByVersion: Map<number, number>,
): boolean {
  return (
    job.status === 'FAILED' &&
    latestJobIdByVersion.get(job.documentVersionId) !==
      job.documentProcessingJobId
  )
}

export function statusLabel(status: ProcessingStatus): string {
  const labels: Record<ProcessingStatus, string> = {
    PENDING: '대기 중',
    PROCESSING: '처리 중',
    COMPLETED: '완료',
    FAILED: '실패',
  }
  return labels[status]
}

export function statusBadgeVariant(
  status: ProcessingStatus,
): NonNullable<BadgeProps['variant']> {
  const variants: Record<
    ProcessingStatus,
    NonNullable<BadgeProps['variant']>
  > = {
    PENDING: 'neutral',
    PROCESSING: 'info',
    COMPLETED: 'success',
    FAILED: 'danger',
  }
  return variants[status]
}
