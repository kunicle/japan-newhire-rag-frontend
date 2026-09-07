import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Skeleton } from '../../shared/ui'
import { fetchEvaluationPublishPreview, publishEvaluation } from './hrEvaluationApi'
import { mapHrEvaluationErrorMessage, mapPublishErrorMessage } from './hrEvaluationHelpers'
import type { EvaluationPublishPreview } from './hrEvaluationTypes'
import styles from './HrEvaluationPublishPanel.module.css'

interface Props { evaluationId: number; employeeName: string; onClose: () => void; onPublished: (evaluationId: number) => void }

export function HrEvaluationPublishPanel({ evaluationId, employeeName, onClose, onPublished }: Props) {
  const [preview, setPreview] = useState<EvaluationPublishPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(true)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [publishReason, setPublishReason] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [publishSuccess, setPublishSuccess] = useState(false)
  const mountedRef = useRef(false)
  const latestPreviewRequestIdRef = useRef(0)
  const publishingRef = useRef(false)

  const loadPreview = useCallback(async () => {
    const requestId = ++latestPreviewRequestIdRef.current
    setPreviewLoading(true); setPreviewError(null); setPreview(null)
    try {
      const response = await fetchEvaluationPublishPreview(evaluationId)
      if (!mountedRef.current || requestId !== latestPreviewRequestIdRef.current) return
      setPreview(response)
      setSelectedIds(new Set(response.managerFeedbacks.filter((feedback) => feedback.isVisibleToEmployee).map((feedback) => feedback.evaluationFeedbackId)))
    } catch (error) {
      if (mountedRef.current && requestId === latestPreviewRequestIdRef.current) setPreviewError(mapHrEvaluationErrorMessage(error, '발행 미리보기를 불러오지 못했습니다.'))
    } finally {
      if (mountedRef.current && requestId === latestPreviewRequestIdRef.current) setPreviewLoading(false)
    }
  }, [evaluationId])

  useEffect(() => { mountedRef.current = true; queueMicrotask(() => void loadPreview()); return () => { mountedRef.current = false; latestPreviewRequestIdRef.current += 1 } }, [loadPreview])

  function toggle(feedbackId: number) { setSelectedIds((current) => { const next = new Set(current); if (next.has(feedbackId)) next.delete(feedbackId); else next.add(feedbackId); return next }) }

  async function handlePublish() {
    if (publishingRef.current || publishSuccess || !preview) return
    if (!window.confirm('선택한 관리자 피드백만 직원에게 공개되며, 평가 결과가 직원에게 발행됩니다. 계속하시겠습니까?')) return
    publishingRef.current = true; setPublishing(true); setPublishError(null)
    try {
      await publishEvaluation(evaluationId, { publishReason: publishReason.length === 0 ? null : publishReason, visibleManagerFeedbackIds: [...selectedIds] })
      if (!mountedRef.current) return
      setPublishSuccess(true)
      onPublished(evaluationId)
    } catch (error) {
      if (mountedRef.current) setPublishError(mapPublishErrorMessage(error, '평가 결과를 발행하지 못했습니다.'))
    } finally {
      publishingRef.current = false
      if (mountedRef.current) setPublishing(false)
    }
  }

  return <aside className={styles.panel} aria-labelledby="publish-panel-title">
    <div className={styles.heading}><h2 id="publish-panel-title">{employeeName} 평가 결과 발행</h2><Button type="button" variant="secondary" disabled={publishing} onClick={onClose}>닫기</Button></div>
    {previewLoading ? <div role="status" aria-label="발행 미리보기를 불러오는 중"><Skeleton lines={4} /></div> : previewError ? <div className={styles.message}><p className={styles.error} role="alert">{previewError}</p><Button type="button" variant="secondary" onClick={() => void loadPreview()}>다시 시도</Button></div> : preview ? <>
      <p className={styles.notice}>자기 평가 피드백은 발행 시 직원에게 공개됩니다.</p>
      <section className={styles.feedbackSection} aria-labelledby="manager-feedback-title"><div className={styles.heading}><h3 id="manager-feedback-title">관리자 피드백 공개 범위</h3>{preview.managerFeedbacks.length > 0 && <div className={styles.smallActions}><Button type="button" size="sm" variant="secondary" disabled={publishing || publishSuccess} onClick={() => setSelectedIds(new Set(preview.managerFeedbacks.map((feedback) => feedback.evaluationFeedbackId)))}>전체 선택</Button><Button type="button" size="sm" variant="secondary" disabled={publishing || publishSuccess} onClick={() => setSelectedIds(new Set())}>전체 해제</Button></div>}</div>
        {preview.managerFeedbacks.length === 0 ? <p className={styles.meta}>공개할 관리자 피드백이 없습니다.</p> : <ul className={styles.feedbackList}>{preview.managerFeedbacks.map((feedback) => <li key={feedback.evaluationFeedbackId}><label className={styles.feedbackRow}><input type="checkbox" checked={selectedIds.has(feedback.evaluationFeedbackId)} disabled={publishing || publishSuccess} onChange={() => toggle(feedback.evaluationFeedbackId)} /><span><strong>{feedback.feedbackType === 'ITEM' ? '항목 피드백' : '종합 피드백'}</strong><span className={styles.feedbackContent}>{feedback.feedbackContent}</span></span></label></li>)}</ul>}
      </section>
      <label className={styles.reason}>발행 사유 (선택)<textarea maxLength={500} disabled={publishing || publishSuccess} value={publishReason} onChange={(event) => setPublishReason(event.target.value)} /></label>
      {publishError && <p className={styles.error} role="alert">{publishError}</p>}
      {publishSuccess && <p className={styles.success} role="status">평가 결과가 발행되었습니다.</p>}
      {!publishSuccess && <div className={styles.actions}><Button type="button" loading={publishing} onClick={() => void handlePublish()}>평가 결과 발행</Button></div>}
    </> : null}
  </aside>
}
