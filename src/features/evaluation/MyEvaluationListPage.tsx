import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, EmptyState, Skeleton } from '../../shared/ui'
import { fetchMyEvaluations } from './evaluationApi'
import {
  evaluationCycleStatusBadgeVariant,
  evaluationCycleStatusLabel,
  evaluationStatusBadgeVariant,
  evaluationStatusLabel,
  mapEvaluationErrorMessage,
} from './evaluationHelpers'
import type { MyEvaluationSummary } from './evaluationTypes'
import styles from './MyEvaluationListPage.module.css'

const LIST_ERROR = '평가 목록을 불러오지 못했습니다.'
const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? '날짜 정보 없음' : dateFormatter.format(date)
}

export function MyEvaluationListPage() {
  const [items, setItems] = useState<MyEvaluationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const latestFetchIdRef = useRef(0)
  const mountedRef = useRef(false)

  const loadEvaluations = useCallback(async () => {
    const requestId = ++latestFetchIdRef.current
    setLoading(true)
    setError(null)
    try {
      const response = await fetchMyEvaluations()
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setItems(response)
    } catch (fetchError) {
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setError(mapEvaluationErrorMessage(fetchError, LIST_ERROR))
    } finally {
      if (mountedRef.current && requestId === latestFetchIdRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    queueMicrotask(() => void loadEvaluations())
    return () => {
      mountedRef.current = false
      latestFetchIdRef.current += 1
    }
  }, [loadEvaluations])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>내 평가</h1>
        <p className={styles.description}>배정된 평가를 확인하고 자기 평가를 작성합니다.</p>
      </header>
      {loading ? (
        <div className={styles.skeletons} role="status" aria-label="평가 목록을 불러오는 중">
          <Skeleton lines={3} /><Skeleton lines={3} /><Skeleton lines={3} />
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <p className={styles.error} role="alert">{error}</p>
          <Button variant="secondary" onClick={() => void loadEvaluations()}>다시 시도</Button>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="배정된 평가가 없습니다."
          description="새로운 평가가 배정되면 이곳에서 확인할 수 있습니다."
        />
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.evaluationId}>
              <Link
                className={styles.card}
                to={`/me/evaluations/${item.evaluationId}`}
                state={{ cycleName: item.cycleName }}
              >
                <div className={styles.cardHeader}>
                  <h2 className={styles.cycleName}>{item.cycleName}</h2>
                  <Badge variant={evaluationStatusBadgeVariant(item.evaluationStatus)}>
                    {evaluationStatusLabel(item.evaluationStatus)}
                  </Badge>
                  <Badge variant={evaluationCycleStatusBadgeVariant(item.currentCycleStatus)}>
                    {evaluationCycleStatusLabel(item.currentCycleStatus)}
                  </Badge>
                </div>
                <p className={styles.period}>
                  {formatDate(item.cycleStartDate)} ~ {formatDate(item.cycleEndDate)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
