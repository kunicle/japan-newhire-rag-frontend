import { describe, expect, it } from 'vitest'
import {
  computeLatestJobIdByVersion,
  isRetryEligible,
  isSupersededFailure,
  statusBadgeVariant,
  statusLabel,
} from './processingHelpers'
import type { DocumentProcessingJob } from './processingTypes'

function job(
  id: number,
  versionId: number,
  status: DocumentProcessingJob['status'],
  createdAt: string,
): DocumentProcessingJob {
  return {
    documentProcessingJobId: id,
    documentVersionId: versionId,
    status,
    failureReason: null,
    createdAt,
  }
}

describe('processingHelpers', () => {
  it('selects the newer creation time for the same version', () => {
    const latest = computeLatestJobIdByVersion([
      job(1, 10, 'FAILED', '2026-01-01T10:00:00Z'),
      job(2, 10, 'COMPLETED', '2026-01-01T11:00:00Z'),
    ])

    expect(latest.get(10)).toBe(2)
  })

  it('uses the larger job ID when creation times match', () => {
    const latest = computeLatestJobIdByVersion([
      job(8, 10, 'FAILED', '2026-01-01T10:00:00Z'),
      job(9, 10, 'FAILED', '2026-01-01T10:00:00Z'),
    ])

    expect(latest.get(10)).toBe(9)
  })

  it('calculates different versions independently', () => {
    const latest = computeLatestJobIdByVersion([
      job(3, 10, 'FAILED', '2026-01-01T10:00:00Z'),
      job(4, 20, 'COMPLETED', '2026-01-01T09:00:00Z'),
    ])

    expect(latest).toEqual(new Map([[10, 3], [20, 4]]))
  })

  it('allows retry only for the latest failed job', () => {
    const latestFailed = job(2, 10, 'FAILED', '2026-01-01T11:00:00Z')
    const latestCompleted = job(4, 20, 'COMPLETED', '2026-01-01T11:00:00Z')
    const oldFailed = job(1, 10, 'FAILED', '2026-01-01T10:00:00Z')
    const latest = new Map([[10, 2], [20, 4]])

    expect(isRetryEligible(latestFailed, latest)).toBe(true)
    expect(isRetryEligible(latestCompleted, latest)).toBe(false)
    expect(isRetryEligible(oldFailed, latest)).toBe(false)
  })

  it('identifies only old failed attempts as superseded', () => {
    const oldFailed = job(1, 10, 'FAILED', '2026-01-01T10:00:00Z')
    const latestFailed = job(2, 10, 'FAILED', '2026-01-01T11:00:00Z')
    const completed = job(3, 20, 'COMPLETED', '2026-01-01T11:00:00Z')
    const latest = new Map([[10, 2], [20, 3]])

    expect(isSupersededFailure(oldFailed, latest)).toBe(true)
    expect(isSupersededFailure(latestFailed, latest)).toBe(false)
    expect(isSupersededFailure(completed, latest)).toBe(false)
  })

  it('maps all status labels', () => {
    expect(statusLabel('PENDING')).toBe('대기 중')
    expect(statusLabel('PROCESSING')).toBe('처리 중')
    expect(statusLabel('COMPLETED')).toBe('완료')
    expect(statusLabel('FAILED')).toBe('실패')
  })

  it('maps all status badge variants', () => {
    expect(statusBadgeVariant('PENDING')).toBe('neutral')
    expect(statusBadgeVariant('PROCESSING')).toBe('info')
    expect(statusBadgeVariant('COMPLETED')).toBe('success')
    expect(statusBadgeVariant('FAILED')).toBe('danger')
  })
})
