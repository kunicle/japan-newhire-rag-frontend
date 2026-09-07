import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../shared/ui'
import { createEvaluationCycle } from './hrEvaluationApi'
import { mapHrEvaluationErrorMessage } from './hrEvaluationHelpers'
import styles from './HrEvaluationCycleCreatePage.module.css'

export function HrEvaluationCycleCreatePage() {
  const navigate = useNavigate()
  const [cycleName, setCycleName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [plannedPublishDate, setPlannedPublishDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (submittingRef.current) return
    if (startDate > endDate || plannedPublishDate < startDate) {
      setError('평가 시작일, 종료일, 발행 예정일을 확인해 주세요.')
      return
    }
    submittingRef.current = true
    setSubmitting(true)
    setError(null)
    try {
      const response = await createEvaluationCycle({ cycleName, startDate, endDate, plannedPublishDate })
      navigate(`/hr/evaluations/${response.evaluationCycleId}`)
    } catch (submitError) {
      setError(mapHrEvaluationErrorMessage(submitError, '평가 주기를 생성하지 못했습니다.'))
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <header><h1 className={styles.title}>평가 관리</h1><p className={styles.description}>새 평가 주기를 생성합니다.</p></header>
      <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
        <div className={styles.field}><label htmlFor="cycle-name">평가 주기명</label><input id="cycle-name" required maxLength={100} value={cycleName} onChange={(e) => setCycleName(e.target.value)} /></div>
        <div className={styles.dateGrid}>
          <div className={styles.field}><label htmlFor="cycle-start">시작일</label><input id="cycle-start" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
          <div className={styles.field}><label htmlFor="cycle-end">종료일</label><input id="cycle-end" type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          <div className={styles.field}><label htmlFor="cycle-publish">발행 예정일</label><input id="cycle-publish" type="date" required value={plannedPublishDate} onChange={(e) => setPlannedPublishDate(e.target.value)} /></div>
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.actions}><Button type="submit" loading={submitting}>평가 주기 생성</Button></div>
      </form>
    </div>
  )
}
