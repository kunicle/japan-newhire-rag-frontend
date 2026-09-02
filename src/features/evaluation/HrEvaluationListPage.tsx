import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Skeleton } from '../../shared/ui'
import { evaluationCycleStatusBadgeVariant, evaluationCycleStatusLabel } from './evaluationHelpers'
import { fetchEvaluationCycles } from './hrEvaluationApi'
import { mapHrEvaluationErrorMessage } from './hrEvaluationHelpers'
import type { EvaluationCycle } from './hrEvaluationTypes'
import { HrEvaluationCycleCreatePage } from './HrEvaluationCycleCreatePage'
import styles from './HrEvaluationListPage.module.css'

export function HrEvaluationListPage() {
  const [cycles, setCycles] = useState<EvaluationCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const mountedRef = useRef(false)
  const latestFetchIdRef = useRef(0)
  const loadCycles = useCallback(async () => {
    const requestId = ++latestFetchIdRef.current
    setLoading(true); setError(null)
    try {
      const response = await fetchEvaluationCycles()
      if (mountedRef.current && requestId === latestFetchIdRef.current) setCycles(response)
    } catch (fetchError) {
      if (mountedRef.current && requestId === latestFetchIdRef.current) setError(mapHrEvaluationErrorMessage(fetchError, '평가 주기 목록을 불러오지 못했습니다.'))
    } finally {
      if (mountedRef.current && requestId === latestFetchIdRef.current) setLoading(false)
    }
  }, [])
  useEffect(() => { mountedRef.current = true; queueMicrotask(() => void loadCycles()); return () => { mountedRef.current = false; latestFetchIdRef.current += 1 } }, [loadCycles])
  return <div className={styles.page}>
    <h1>평가 관리</h1>
    <section className={styles.section} aria-labelledby="cycle-list-title">
      <div className={styles.sectionHeader}><h2 id="cycle-list-title">평가 주기 목록</h2></div>
      {loading && cycles.length === 0 ? <div role="status" aria-label="평가 주기 목록을 불러오는 중"><Skeleton lines={4} /></div> : error ? <div><p className={styles.error} role="alert">{error}</p><Button variant="secondary" onClick={() => void loadCycles()}>다시 시도</Button></div> : cycles.length === 0 ? <p className={styles.meta}>등록된 평가 주기가 없습니다.</p> : <ul className={styles.cardList}>{cycles.map((cycle) => <li key={cycle.evaluationCycleId}><Link className={styles.card} to={`/hr/evaluations/${cycle.evaluationCycleId}`}><div className={styles.sectionHeader}><h3>{cycle.cycleName}</h3><Badge variant={evaluationCycleStatusBadgeVariant(cycle.cycleStatus)}>{evaluationCycleStatusLabel(cycle.cycleStatus)}</Badge></div><p>{cycle.startDate} ~ {cycle.endDate}</p><p className={styles.meta}>발행 예정일 {cycle.plannedPublishDate}</p></Link></li>)}</ul>}
    </section>
    <section className={styles.section} aria-labelledby="create-cycle-title">
      <div className={styles.sectionHeader}><h2 id="create-cycle-title">새 평가 주기 만들기</h2><Button onClick={() => setShowCreate((current) => !current)} aria-expanded={showCreate}>{showCreate ? '닫기' : '새 평가 주기 만들기'}</Button></div>
      {showCreate && <HrEvaluationCycleCreatePage />}
    </section>
  </div>
}
