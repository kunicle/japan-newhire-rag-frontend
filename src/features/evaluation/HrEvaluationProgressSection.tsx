import { Badge, Button, Skeleton } from '../../shared/ui'
import { progressStatusBadgeVariant, progressStatusLabel } from './hrEvaluationHelpers'
import type { EvaluationProgress, EvaluationProgressDetail, EvaluationProgressSummary } from './hrEvaluationTypes'
import styles from './HrEvaluationListPage.module.css'

interface Props { progress: EvaluationProgress | null; loading: boolean; error: string | null; onRetry: () => void }
function Summary({ title, summary }: { title: string; summary: EvaluationProgressSummary }) { return <div className={styles.summary}><h3>{title}</h3><dl><dt>시작 전</dt><dd>{summary.notStartedCount}</dd><dt>작성 중</dt><dd>{summary.inProgressCount}</dd><dt>제출 완료</dt><dd>{summary.submittedCount}</dd></dl></div> }
function ProgressBadge({ detail }: { detail: EvaluationProgressDetail | null }) { return detail ? <Badge variant={progressStatusBadgeVariant(detail.progressStatus)}>{progressStatusLabel(detail.progressStatus)}</Badge> : <span className={styles.meta}>데이터 없음</span> }

export function HrEvaluationProgressSection({ progress, loading, error, onRetry }: Props) {
  return <section className={styles.section} aria-labelledby="progress-title">
    <h2 id="progress-title">진행 현황</h2>
    {loading && !progress ? <div role="status" aria-label="평가 진행 현황을 불러오는 중"><Skeleton lines={5} /></div> : error ? <div><p className={styles.error} role="alert">{error}</p><Button variant="secondary" onClick={onRetry}>다시 시도</Button></div> : progress ? <div className={styles.panel}>
      <p>배정 대상 <strong>{progress.totalTargetCount}명</strong></p>
      <div className={styles.summaryGrid}><Summary title="자기 평가" summary={progress.selfSummary} /><Summary title="관리자 평가" summary={progress.managerSummary} /></div>
      {progress.employees.length === 0 ? <p className={styles.meta}>배정된 직원이 없습니다.</p> : <ul className={styles.progressList}>{progress.employees.map((entry) => <li className={styles.progressRow} key={entry.employee.employeeId}><div className={styles.progressCell}><strong>{entry.employee.employeeName}</strong><div className={styles.meta}>{entry.employee.departmentName ?? '부서 미지정'} · {entry.employee.jobGradeName ?? '직급 미지정'}</div></div><div className={styles.progressCell}><span className={styles.meta}>자기 평가</span><div><ProgressBadge detail={entry.selfEvaluation} /></div></div><div className={styles.progressCell}><span className={styles.meta}>관리자 평가</span><div><ProgressBadge detail={entry.managerEvaluation} /></div></div></li>)}</ul>}
    </div> : null}
  </section>
}
