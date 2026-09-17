import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, EmptyState, Skeleton } from '../../shared/ui'
import { getMyUpwardEvaluations } from './evaluationApi'
import { evaluationCycleStatusBadgeVariant, evaluationCycleStatusLabel, evaluationStatusBadgeVariant, evaluationStatusLabel, mapEvaluationErrorMessage } from './evaluationHelpers'
import type { MyEvaluationSummary } from './evaluationTypes'
import styles from './MyEvaluationListPage.module.css'

export function MyUpwardEvaluationListPage() {
  const [items, setItems] = useState<MyEvaluationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(false)
  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { const response = await getMyUpwardEvaluations(); if (mounted.current) setItems(response) }
    catch (cause) { if (mounted.current) setError(mapEvaluationErrorMessage(cause, '상사 평가 목록을 불러오지 못했습니다.')) }
    finally { if (mounted.current) setLoading(false) }
  }, [])
  useEffect(() => { mounted.current = true; void load(); return () => { mounted.current = false } }, [load])
  return <div className={styles.page}><header className={styles.header}><h1 className={styles.title}>상사 평가</h1></header>
    {loading ? <div role="status"><Skeleton lines={3} /></div> : error ? <div className={styles.errorState}><p className={styles.error} role="alert">{error}</p><Button variant="secondary" onClick={() => void load()}>다시 시도</Button></div> : items.length === 0 ? <EmptyState title="배정된 상사 평가가 없습니다." description="상사 평가가 배정되면 이곳에서 확인할 수 있습니다." /> : <ul className={styles.list}>{items.map((item) => <li key={item.evaluationId}><Link to={`/me/evaluations/upward/${item.evaluationId}`} className={styles.card}><div className={styles.cardHeader}><h2 className={styles.cycleName}>{item.cycleName}</h2><Badge variant={evaluationStatusBadgeVariant(item.evaluationStatus)}>{evaluationStatusLabel(item.evaluationStatus)}</Badge><Badge variant={evaluationCycleStatusBadgeVariant(item.currentCycleStatus)}>{evaluationCycleStatusLabel(item.currentCycleStatus)}</Badge></div><p className={styles.period}>{item.cycleStartDate} ~ {item.cycleEndDate}</p></Link></li>)}</ul>}
  </div>
}
