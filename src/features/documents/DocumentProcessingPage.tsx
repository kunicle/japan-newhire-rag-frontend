import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Badge, Button, EmptyState, Skeleton } from '../../shared/ui'
import {
  fetchDocumentProcessingJobs,
  retryDocumentProcessingJob,
} from './processingApi'
import { mapProcessingErrorMessage } from './processingErrors'
import {
  computeLatestJobIdByVersion,
  isRetryEligible,
  isSupersededFailure,
  statusBadgeVariant,
  statusLabel,
} from './processingHelpers'
import type { DocumentProcessingJob } from './processingTypes'
import styles from './DocumentProcessingPage.module.css'

const LIST_ERROR_MESSAGE = '문서 처리 현황을 불러오지 못했습니다.'
const RETRY_ERROR_MESSAGE = '재시도 요청을 처리하지 못했습니다.'
const FAILED_MESSAGE = '문서 처리 중 오류가 발생했습니다.'

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatCreatedAt(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '날짜 정보 없음'
    : dateFormatter.format(date)
}

export function DocumentProcessingPage() {
  const [jobs, setJobs] = useState<DocumentProcessingJob[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [retryingJobIds, setRetryingJobIds] = useState<Set<number>>(new Set())
  const [retryErrorByJobId, setRetryErrorByJobId] =
    useState<Map<number, string>>(new Map())
  const latestFetchIdRef = useRef(0)
  const retryingJobIdsRef = useRef<Set<number>>(new Set())
  const mountedRef = useRef(false)

  const loadJobs = useCallback(async () => {
    const requestId = ++latestFetchIdRef.current
    setListLoading(true)
    setListError(null)

    try {
      const response = await fetchDocumentProcessingJobs()
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setJobs(response)
    } catch {
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setListError(LIST_ERROR_MESSAGE)
    } finally {
      if (mountedRef.current && requestId === latestFetchIdRef.current) {
        setListLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    queueMicrotask(() => {
      void loadJobs()
    })

    return () => {
      mountedRef.current = false
      latestFetchIdRef.current += 1
    }
  }, [loadJobs])

  async function handleRetry(jobId: number) {
    if (retryingJobIdsRef.current.has(jobId)) return

    retryingJobIdsRef.current.add(jobId)
    setRetryingJobIds(new Set(retryingJobIdsRef.current))
    setRetryErrorByJobId((current) => {
      const next = new Map(current)
      next.delete(jobId)
      return next
    })

    try {
      await retryDocumentProcessingJob(jobId)
    } catch (error) {
      if (mountedRef.current) {
        setRetryErrorByJobId((current) => {
          const next = new Map(current)
          next.set(
            jobId,
            mapProcessingErrorMessage(error, RETRY_ERROR_MESSAGE),
          )
          return next
        })
      }
    } finally {
      retryingJobIdsRef.current.delete(jobId)
      if (mountedRef.current) {
        setRetryingJobIds(new Set(retryingJobIdsRef.current))
        await loadJobs()
      }
    }
  }

  const latestJobIdByVersion = useMemo(
    () => computeLatestJobIdByVersion(jobs),
    [jobs],
  )
  const initialLoading = listLoading && jobs.length === 0

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>문서 처리 현황</h1>
          <p className={styles.description}>
            업로드한 문서의 처리 상태를 확인하고 실패한 작업을 다시 처리할 수 있습니다.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          loading={listLoading}
          disabled={listLoading}
          onClick={() => void loadJobs()}
        >
          새로고침
        </Button>
      </header>

      <div className={styles.content}>
        {initialLoading ? (
          <div className={styles.skeletonList} aria-label="문서 처리 현황을 불러오는 중">
            <Skeleton lines={3} />
            <Skeleton lines={3} />
            <Skeleton lines={3} />
          </div>
        ) : listError && jobs.length === 0 ? (
          <div className={styles.listError}>
            <p className={styles.errorMessage} role="alert">{listError}</p>
            <Button type="button" variant="secondary" onClick={() => void loadJobs()}>
              다시 시도
            </Button>
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            title="처리 이력이 없습니다."
            description="문서를 업로드하면 처리 상태가 여기에 표시됩니다."
          />
        ) : (
          <>
            {listError && (
              <div className={styles.listError}>
                <p className={styles.errorMessage} role="alert">{listError}</p>
                <Button type="button" variant="secondary" onClick={() => void loadJobs()}>
                  다시 시도
                </Button>
              </div>
            )}
            <ul className={styles.jobList} aria-label="문서 처리 작업 목록">
              {jobs.map((job) => {
                const retryEligible = isRetryEligible(job, latestJobIdByVersion)
                const superseded = isSupersededFailure(job, latestJobIdByVersion)
                const retryError = retryErrorByJobId.get(job.documentProcessingJobId)

                return (
                  <li className={styles.jobItem} key={job.documentProcessingJobId}>
                    <div className={styles.itemHeader}>
                      <h2 className={styles.itemTitle}>
                        문서 버전 #{job.documentVersionId}
                      </h2>
                      <Badge variant={statusBadgeVariant(job.status)}>
                        {statusLabel(job.status)}
                      </Badge>
                    </div>
                    <time className={styles.timestamp} dateTime={job.createdAt}>
                      {formatCreatedAt(job.createdAt)}
                    </time>
                    {job.status === 'FAILED' && (
                      <p className={styles.failureMessage}>{FAILED_MESSAGE}</p>
                    )}
                    <div className={styles.itemFooter}>
                      {retryEligible && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          loading={retryingJobIds.has(job.documentProcessingJobId)}
                          disabled={retryingJobIds.has(job.documentProcessingJobId)}
                          onClick={() => void handleRetry(job.documentProcessingJobId)}
                        >
                          재시도
                        </Button>
                      )}
                      {superseded && (
                        <span className={styles.superseded}>이후 처리 이력 있음</span>
                      )}
                    </div>
                    {retryError && (
                      <p className={styles.errorMessage} role="alert">{retryError}</p>
                    )}
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
