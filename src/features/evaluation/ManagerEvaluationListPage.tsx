import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, EmptyState, Skeleton } from '../../shared/ui'
import {
  evaluationCycleStatusBadgeVariant,
  evaluationCycleStatusLabel,
  evaluationStatusBadgeVariant,
  evaluationStatusLabel,
} from './evaluationHelpers'
import {
  fetchManagerEvaluationProgress,
  fetchManagerEvaluations,
} from './managerEvaluationApi'
import { mapManagerEvaluationErrorMessage } from './managerEvaluationHelpers'
import type {
  ManagerEvaluationProgress,
  ManagerEvaluationSummary,
} from './managerEvaluationTypes'
import styles from './ManagerEvaluationListPage.module.css'

interface ProgressState {
  loading: boolean
  data: ManagerEvaluationProgress | null
  error: string | null
}

const LIST_ERROR = '팀 평가 목록을 불러오지 못했습니다.'
const PROGRESS_ERROR = '평가 진행 현황을 불러오지 못했습니다.'

export function ManagerEvaluationListPage() {
  const [items, setItems] = useState<ManagerEvaluationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progressByCycleId, setProgressByCycleId] =
    useState<Map<number, ProgressState>>(new Map())
  const latestFetchIdRef = useRef(0)
  const progressFetchIdRef = useRef(0)
  const cycleProgressRequestIdsRef = useRef<Map<number, number>>(new Map())
  const mountedRef = useRef(false)

  const loadProgress = useCallback(async (
    cycleId: number,
    generation: number = progressFetchIdRef.current,
  ) => {
    const requestId = (cycleProgressRequestIdsRef.current.get(cycleId) ?? 0) + 1
    cycleProgressRequestIdsRef.current.set(cycleId, requestId)
    setProgressByCycleId((current) => {
      const next = new Map(current)
      next.set(cycleId, { loading: true, data: null, error: null })
      return next
    })
    try {
      const response = await fetchManagerEvaluationProgress(cycleId)
      if (
        !mountedRef.current ||
        generation !== progressFetchIdRef.current ||
        requestId !== cycleProgressRequestIdsRef.current.get(cycleId)
      ) return
      setProgressByCycleId((current) => {
        const next = new Map(current)
        next.set(cycleId, { loading: false, data: response, error: null })
        return next
      })
    } catch (progressError) {
      if (
        !mountedRef.current ||
        generation !== progressFetchIdRef.current ||
        requestId !== cycleProgressRequestIdsRef.current.get(cycleId)
      ) return
      setProgressByCycleId((current) => {
        const next = new Map(current)
        next.set(cycleId, {
          loading: false,
          data: null,
          error: mapManagerEvaluationErrorMessage(progressError, PROGRESS_ERROR),
        })
        return next
      })
    }
  }, [])

  const loadEvaluations = useCallback(async () => {
    const requestId = ++latestFetchIdRef.current
    const progressGeneration = ++progressFetchIdRef.current
    cycleProgressRequestIdsRef.current.clear()
    setProgressByCycleId(new Map())
    setLoading(true)
    setError(null)
    try {
      const response = await fetchManagerEvaluations()
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setItems(response)
      const cycleIds = [...new Set(response.map((item) => item.evaluationCycleId))]
      for (const cycleId of cycleIds) void loadProgress(cycleId, progressGeneration)
    } catch (fetchError) {
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setError(mapManagerEvaluationErrorMessage(fetchError, LIST_ERROR))
    } finally {
      if (mountedRef.current && requestId === latestFetchIdRef.current) setLoading(false)
    }
  }, [loadProgress])

  useEffect(() => {
    const cycleProgressRequestIds = cycleProgressRequestIdsRef.current
    mountedRef.current = true
    queueMicrotask(() => void loadEvaluations())
    return () => {
      mountedRef.current = false
      latestFetchIdRef.current += 1
      progressFetchIdRef.current += 1
      cycleProgressRequestIds.clear()
    }
  }, [loadEvaluations])

  const cycleIds = [...new Set(items.map((item) => item.evaluationCycleId))]

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>팀 평가</h1>
        <p className={styles.description}>담당 팀원의 평가 진행 현황을 확인하고 평가를 작성합니다.</p>
      </header>
      {loading ? (
        <div className={styles.skeletons} role="status" aria-label="팀 평가 목록을 불러오는 중">
          <Skeleton lines={3} /><Skeleton lines={3} /><Skeleton lines={3} />
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <p className={styles.error} role="alert">{error}</p>
          <Button variant="secondary" onClick={() => void loadEvaluations()}>다시 시도</Button>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="배정된 팀원 평가가 없습니다."
          description="담당할 팀원 평가가 배정되면 이곳에서 확인할 수 있습니다."
        />
      ) : (
        <>
          <section className={styles.progressSection} aria-labelledby="progress-title">
            <h2 className={styles.sectionTitle} id="progress-title">진행 현황</h2>
            <div className={styles.progressGrid}>
              {cycleIds.map((cycleId) => {
                const progress = progressByCycleId.get(cycleId)
                return (
                  <article className={styles.progressCard} key={cycleId}>
                    {!progress || progress.loading ? (
                      <div role="status" aria-label="평가 진행 현황을 불러오는 중">
                        <Skeleton lines={3} />
                      </div>
                    ) : progress.error ? (
                      <div className={styles.errorState}>
                        <p className={styles.error} role="alert">{progress.error}</p>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void loadProgress(cycleId)}
                        >
                          다시 시도
                        </Button>
                      </div>
                    ) : progress.data ? (
                      <>
                        <h3 className={styles.progressTitle}>{progress.data.cycleName}</h3>
                        <p className={styles.progressMain}>
                          완료 {progress.data.completedEmployees} / 전체 {progress.data.totalEmployees}
                          {' · '}{progress.data.completionRate}%
                        </p>
                        <p className={styles.progressDetail}>
                          자기 평가 완료 {progress.data.selfCompletedCount} · Manager 평가 완료{' '}
                          {progress.data.managerCompletedCount}
                        </p>
                      </>
                    ) : null}
                  </article>
                )
              })}
            </div>
          </section>

          <section aria-labelledby="manager-evaluation-list-title">
            <h2 className={styles.sectionTitle} id="manager-evaluation-list-title">팀원 평가</h2>
            <ul className={styles.list}>
              {items.map((item) => (
                <li key={item.evaluationId}>
                  <Link
                    className={styles.card}
                    to={`/manager/evaluations/${item.evaluationId}`}
                  >
                    <div className={styles.cardHeader}>
                      <h3 className={styles.employeeName}>{item.targetEmployee.employeeName}</h3>
                      <Badge variant={evaluationStatusBadgeVariant(item.evaluationStatus)}>
                        {evaluationStatusLabel(item.evaluationStatus)}
                      </Badge>
                      <Badge variant={evaluationCycleStatusBadgeVariant(item.currentCycleStatus)}>
                        {evaluationCycleStatusLabel(item.currentCycleStatus)}
                      </Badge>
                    </div>
                    <p className={styles.employeeInfo}>
                      {item.targetEmployee.departmentName} · {item.targetEmployee.jobGradeName}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
