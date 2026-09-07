import { Badge, Button, Skeleton } from '../../shared/ui'
import type { EvaluationCycleStatus } from './evaluationTypes'
import { getPublishEvaluationId, isPublishCandidate, isPublished, progressStatusBadgeVariant, progressStatusLabel } from './hrEvaluationHelpers'
import type { EvaluationProgress, EvaluationProgressDetail, EvaluationProgressEmployee, EvaluationProgressSummary } from './hrEvaluationTypes'
import styles from './HrEvaluationListPage.module.css'

interface Props { progress: EvaluationProgress | null; loading: boolean; error: string | null; onRetry: () => void; cycleStatus: EvaluationCycleStatus; onPreparePublish?: (evaluationId: number, employeeName: string) => void; locallyPublishedEvaluationIds?: ReadonlySet<number> }
function Summary({ title, summary }: { title: string; summary: EvaluationProgressSummary }) { return <div className={styles.summary}><h3>{title}</h3><dl><dt>시작 전</dt><dd>{summary.notStartedCount}</dd><dt>작성 중</dt><dd>{summary.inProgressCount}</dd><dt>제출 완료</dt><dd>{summary.submittedCount}</dd></dl></div> }
function ProgressBadge({ detail }: { detail: EvaluationProgressDetail | null }) { return detail ? <Badge variant={progressStatusBadgeVariant(detail.progressStatus)}>{progressStatusLabel(detail.progressStatus)}</Badge> : <span className={styles.meta}>데이터 없음</span> }
function EmployeeRow({ entry, cycleStatus, onPreparePublish, locallyPublishedEvaluationIds }: { entry: EvaluationProgressEmployee; cycleStatus: EvaluationCycleStatus; onPreparePublish?: Props['onPreparePublish']; locallyPublishedEvaluationIds?: ReadonlySet<number> }) {
  const evaluationId = getPublishEvaluationId(entry)
  const locallyPublished = evaluationId != null && locallyPublishedEvaluationIds?.has(evaluationId)
  return <li className={styles.progressRow}><div className={styles.progressCell}><strong>{entry.employee.employeeName}</strong><div className={styles.meta}>{entry.employee.departmentName ?? '부서 미지정'} · {entry.employee.jobGradeName ?? '직급 미지정'}</div><div>{isPublished(entry) || locallyPublished ? <Badge variant="success">발행 완료</Badge> : isPublishCandidate(cycleStatus, entry) && evaluationId != null && onPreparePublish ? <Button type="button" size="sm" variant="secondary" onClick={() => onPreparePublish(evaluationId, entry.employee.employeeName)}>발행 준비</Button> : null}</div></div><div className={styles.progressCell}><span className={styles.meta}>자기 평가</span><div><ProgressBadge detail={entry.selfEvaluation} /></div></div><div className={styles.progressCell}><span className={styles.meta}>관리자 평가</span><div><ProgressBadge detail={entry.managerEvaluation} /></div></div></li>
}

export function HrEvaluationProgressSection({ progress, loading, error, onRetry, cycleStatus, onPreparePublish, locallyPublishedEvaluationIds }: Props) {
  return <section className={styles.section} aria-labelledby="progress-title">
    <h2 id="progress-title">진행 현황</h2>
    {loading && !progress ? <div role="status" aria-label="평가 진행 현황을 불러오는 중"><Skeleton lines={5} /></div> : error ? <div><p className={styles.error} role="alert">{error}</p><Button variant="secondary" onClick={onRetry}>다시 시도</Button></div> : progress ? <div className={styles.panel}>
      <p>배정 대상 <strong>{progress.totalTargetCount}명</strong></p>
      <div className={styles.summaryGrid}><Summary title="자기 평가" summary={progress.selfSummary} /><Summary title="관리자 평가" summary={progress.managerSummary} /></div>
      {progress.employees.length === 0 ? <p className={styles.meta}>배정된 직원이 없습니다.</p> : <ul className={styles.progressList}>{progress.employees.map((entry) => <EmployeeRow key={entry.employee.employeeId} entry={entry} cycleStatus={cycleStatus} onPreparePublish={onPreparePublish} locallyPublishedEvaluationIds={locallyPublishedEvaluationIds} />)}</ul>}
    </div> : null}
  </section>
}
