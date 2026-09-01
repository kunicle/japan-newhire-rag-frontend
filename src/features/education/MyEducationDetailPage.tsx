import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge, Button, EmptyState, Skeleton } from '../../shared/ui'
import {
  completeLearningProgress,
  fetchMyCourseDetail,
  startLearningProgress,
} from './educationApi'
import {
  enrollmentStatusBadgeVariant,
  enrollmentStatusLabel,
  formatProgressRate,
  mapEducationErrorMessage,
  moduleStatusBadgeVariant,
  moduleStatusLabel,
} from './educationHelpers'
import type {
  LearningProgressUpdateResult,
  MyCourseDetail,
} from './educationTypes'
import styles from './MyEducationDetailPage.module.css'

const DETAIL_ERROR_MESSAGE = '교육 과정 정보를 불러오지 못했습니다.'
const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})
const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? '날짜 정보 없음' : dateFormatter.format(date)
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '날짜 정보 없음' : dateTimeFormatter.format(date)
}

export function MyEducationDetailPage() {
  const { enrollmentId: enrollmentIdParam } = useParams()
  const enrollmentId = Number(enrollmentIdParam)
  const validEnrollmentId = Number.isInteger(enrollmentId) && enrollmentId > 0
  const [detail, setDetail] = useState<MyCourseDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(validEnrollmentId)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [pendingProgressIds, setPendingProgressIds] = useState<Set<number>>(new Set())
  const [actionErrorByProgressId, setActionErrorByProgressId] =
    useState<Map<number, string>>(new Map())
  const latestFetchIdRef = useRef(0)
  const pendingProgressIdsRef = useRef<Set<number>>(new Set())
  const mountedRef = useRef(false)

  const loadDetail = useCallback(async () => {
    if (!validEnrollmentId) return
    const requestId = ++latestFetchIdRef.current
    setDetailLoading(true)
    setDetailError(null)
    setDetail(null)
    try {
      const response = await fetchMyCourseDetail(enrollmentId)
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setDetail(response)
    } catch (fetchError) {
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setDetailError(mapEducationErrorMessage(fetchError, DETAIL_ERROR_MESSAGE))
    } finally {
      if (mountedRef.current && requestId === latestFetchIdRef.current) {
        setDetailLoading(false)
      }
    }
  }, [enrollmentId, validEnrollmentId])

  useEffect(() => {
    const pendingIds = pendingProgressIdsRef.current
    mountedRef.current = true
    if (validEnrollmentId) {
      queueMicrotask(() => {
        setPendingProgressIds(new Set())
        setActionErrorByProgressId(new Map())
        void loadDetail()
      })
    }
    return () => {
      mountedRef.current = false
      latestFetchIdRef.current += 1
      pendingIds.clear()
    }
  }, [loadDetail, validEnrollmentId])

  async function handleModuleAction(
    progressId: number,
    action: (id: number) => Promise<LearningProgressUpdateResult>,
    fallback: string,
  ) {
    if (pendingProgressIdsRef.current.has(progressId)) return

    pendingProgressIdsRef.current.add(progressId)
    setPendingProgressIds(new Set(pendingProgressIdsRef.current))
    setActionErrorByProgressId((current) => {
      const next = new Map(current)
      next.delete(progressId)
      return next
    })

    let writeSucceeded = false
    try {
      await action(progressId)
      writeSucceeded = true
    } catch (actionError) {
      if (mountedRef.current) {
        setActionErrorByProgressId((current) => {
          const next = new Map(current)
          next.set(progressId, mapEducationErrorMessage(actionError, fallback))
          return next
        })
      }
    }

    if (writeSucceeded && mountedRef.current) {
      await loadDetail()
    }

    pendingProgressIdsRef.current.delete(progressId)
    if (mountedRef.current) {
      setPendingProgressIds(new Set(pendingProgressIdsRef.current))
    }
  }

  if (!validEnrollmentId) {
    return (
      <div className={styles.page}>
        <p className={styles.error} role="alert">잘못된 교육 과정 정보입니다.</p>
        <Link className={styles.backLink} to="/me/education">내 교육으로 돌아가기</Link>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Link className={styles.backLink} to="/me/education">내 교육으로 돌아가기</Link>
      {detailLoading ? (
        <div className={styles.skeletons} role="status" aria-label="교육 과정 정보를 불러오는 중">
          <Skeleton lines={4} /><Skeleton lines={5} /><Skeleton lines={5} />
        </div>
      ) : detailError ? (
        <div className={styles.errorState}>
          <p className={styles.error} role="alert">{detailError}</p>
          <Button variant="secondary" onClick={() => void loadDetail()}>다시 시도</Button>
        </div>
      ) : detail ? (
        <>
          <header className={styles.header}>
            <div className={styles.headingRow}>
              <h1 className={styles.title}>{detail.courseName}</h1>
              <Badge variant={detail.required ? 'warning' : 'neutral'}>
                {detail.required ? '필수' : '선택'}
              </Badge>
              <Badge variant={enrollmentStatusBadgeVariant(detail.status)}>
                {enrollmentStatusLabel(detail.status)}
              </Badge>
            </div>
            <p className={styles.description}>{detail.courseDescription}</p>
            <dl className={styles.courseDetails}>
              <div><dt>교육 차수</dt><dd>{detail.enrollmentRound}</dd></div>
              <div>
                <dt>학습 기간</dt>
                <dd>{formatDate(detail.enrollmentStartDate)} ~ {formatDate(detail.enrollmentDueDate)}</dd>
              </div>
              {detail.completedAt && (
                <div><dt>완료일시</dt><dd>{formatDateTime(detail.completedAt)}</dd></div>
              )}
            </dl>
            <div className={styles.progressText}>
              <span>진행률</span>
              <span>{formatProgressRate(detail.progressRate)}</span>
            </div>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-label={`${detail.courseName} 진행률`}
              aria-valuenow={detail.progressRate}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className={styles.progressFill} style={{ width: `${detail.progressRate}%` }} />
            </div>
            <p className={styles.progressNote}>진행률은 필수 모듈을 기준으로 계산됩니다.</p>
          </header>

          <section aria-labelledby="modules-title">
            <h2 className={styles.sectionTitle} id="modules-title">학습 모듈</h2>
            {detail.modules.length === 0 ? (
              <EmptyState title="학습 모듈이 없습니다." description="등록된 학습 모듈이 없습니다." />
            ) : (
              <ol className={styles.moduleList}>
                {detail.modules.map((module) => {
                  const pending = pendingProgressIds.has(module.progressId)
                  const actionError = actionErrorByProgressId.get(module.progressId)
                  return (
                    <li className={styles.moduleItem} key={module.progressId}>
                      <div className={styles.moduleHeader}>
                        <h3 className={styles.moduleTitle}>{module.moduleTitle}</h3>
                        <Badge variant={module.required ? 'warning' : 'neutral'}>
                          {module.required ? '필수' : '선택'}
                        </Badge>
                        <Badge variant={moduleStatusBadgeVariant(module.completionStatus)}>
                          {moduleStatusLabel(module.completionStatus)}
                        </Badge>
                      </div>
                      {module.moduleContent?.trim() && (
                        <p className={styles.moduleContent}>{module.moduleContent}</p>
                      )}
                      {module.referenceUrl && (
                        <a className={styles.referenceLink} href={module.referenceUrl} target="_blank" rel="noreferrer">
                          참고 자료 열기
                        </a>
                      )}
                      <div className={styles.moduleDates}>
                        {module.startedAt && <time dateTime={module.startedAt}>시작 {formatDateTime(module.startedAt)}</time>}
                        {module.completedAt && <time dateTime={module.completedAt}>완료 {formatDateTime(module.completedAt)}</time>}
                      </div>
                      {module.completionStatus === 'NOT_STARTED' && (
                        <Button
                          size="sm"
                          loading={pending}
                          disabled={pending}
                          onClick={() => void handleModuleAction(
                            module.progressId,
                            startLearningProgress,
                            '학습 시작에 실패했습니다.',
                          )}
                        >
                          학습 시작
                        </Button>
                      )}
                      {module.completionStatus === 'IN_PROGRESS' && (
                        <Button
                          size="sm"
                          loading={pending}
                          disabled={pending}
                          onClick={() => void handleModuleAction(
                            module.progressId,
                            completeLearningProgress,
                            '학습 완료 처리에 실패했습니다.',
                          )}
                        >
                          학습 완료
                        </Button>
                      )}
                      {actionError && <p className={styles.error} role="alert">{actionError}</p>}
                    </li>
                  )
                })}
              </ol>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
