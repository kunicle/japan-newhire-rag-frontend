import { useCallback, useEffect, useRef, useState } from 'react'
import { AppError } from '../../shared/api/errors'
import { Badge, Button, Skeleton } from '../../shared/ui'
import { fetchAuditLogs } from './auditApi'
import { actionLabel, parseAuditValue, targetTypeLabel } from './auditViewHelpers'
import type { AuditActionType, AuditLogEntry, AuditLogFilters, AuditTargetType } from './types'
import styles from './AuditPage.module.css'

const PAGE_SIZE = 20
const ACTIONS: AuditActionType[] = ['USER_CREATED', 'ACCOUNT_ACTIVATED', 'ACCOUNT_DEACTIVATED', 'ROLE_GRANTED', 'ROLE_REVOKED', 'DIRECT_MANAGER_CHANGED', 'EVALUATION_RESULT_PUBLISHED']
const TARGETS: AuditTargetType[] = ['APP_USER', 'USER_ROLE', 'EMPLOYEE', 'EVALUATION']
const dateFormatter = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })
const KEY_LABELS: Record<string, string> = { roleType: '역할', managerEmployeeId: '관리자 직원 ID', cycleId: '평가 주기 ID', visibleManagerFeedbackIds: '공개 관리자 피드백 ID' }
interface DraftFilters { actionType: '' | AuditActionType; targetType: '' | AuditTargetType; actorUserIdText: string; targetIdText: string; from: string; to: string }
const EMPTY_DRAFT: DraftFilters = { actionType: '', targetType: '', actorUserIdText: '', targetIdText: '', from: '', to: '' }

function parseIdentifier(value: string): number | undefined | null { if (!value.trim()) return undefined; const parsed = Number(value); return Number.isFinite(parsed) && Number.isInteger(parsed) && parsed > 0 ? parsed : null }
function errorMessage(error: unknown): string { if (error instanceof AppError && error.status === 403) return '감사 로그를 조회할 권한이 없습니다.'; if (error instanceof AppError && error.status === 400) return '조회 조건을 확인해 주세요.'; return '감사 로그를 불러오지 못했습니다.' }
function formatCreatedAt(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? '날짜 정보 없음' : dateFormatter.format(date) }
function formatValue(value: unknown): string { if (Array.isArray(value)) return value.map((item) => typeof item === 'object' && item !== null ? '[객체]' : String(item)).join(', '); if (typeof value === 'object' && value !== null) return '[객체]'; return String(value) }

function AuditValue({ title, raw }: { title: string; raw: string | null }) {
  if (raw === null) return null
  const parsed = parseAuditValue(raw)
  return <section className={styles.valueSection}><h3>{title}</h3>{parsed ? <dl className={styles.metadata}>{Object.entries(parsed).map(([key, value]) => <div key={key}><dt>{KEY_LABELS[key] ?? key}</dt><dd>{formatValue(value)}</dd></div>)}</dl> : <pre className={styles.rawValue}>{raw}</pre>}</section>
}

export function AuditPage() {
  const [draft, setDraft] = useState<DraftFilters>(EMPTY_DRAFT)
  const [appliedFilters, setAppliedFilters] = useState<AuditLogFilters>({})
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)
  const [filterError, setFilterError] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const mountedRef = useRef(false)
  const latestListFetchIdRef = useRef(0)
  const loadingMoreRef = useRef(false)

  const loadLogs = useCallback(async (filters: AuditLogFilters, requestedPage: number, append: boolean) => {
    const requestId = ++latestListFetchIdRef.current
    if (append) { loadingMoreRef.current = true; setLoadingMore(true); setLoadMoreError(null) } else { loadingMoreRef.current = false; setLoadingMore(false); setInitialLoading(true); setError(null); setEntries([]); setPage(0); setTotalPages(0); setExpandedIds(new Set()) }
    try {
      const response = await fetchAuditLogs(filters, requestedPage, PAGE_SIZE)
      if (!mountedRef.current || requestId !== latestListFetchIdRef.current) return
      setEntries((current) => append ? [...current, ...response.content] : response.content)
      setPage(response.page); setTotalPages(response.totalPages)
    } catch (loadError) {
      if (!mountedRef.current || requestId !== latestListFetchIdRef.current) return
      if (append) setLoadMoreError(errorMessage(loadError)); else setError(errorMessage(loadError))
    } finally {
      if (mountedRef.current && requestId === latestListFetchIdRef.current) { if (append) { loadingMoreRef.current = false; setLoadingMore(false) } else setInitialLoading(false) }
    }
  }, [])

  useEffect(() => { const effectId = ++latestListFetchIdRef.current; mountedRef.current = true; queueMicrotask(() => { if (mountedRef.current && latestListFetchIdRef.current === effectId) void loadLogs({}, 0, false) }); return () => { mountedRef.current = false; latestListFetchIdRef.current += 1 } }, [loadLogs])

  function applyFilters(event: React.FormEvent) {
    event.preventDefault(); setFilterError(null)
    const actorUserId = parseIdentifier(draft.actorUserIdText); const targetId = parseIdentifier(draft.targetIdText)
    if (actorUserId === null || targetId === null) { setFilterError('조회 조건을 확인해 주세요.'); return }
    if (draft.from && draft.to && draft.from > draft.to) { setFilterError('조회 기간을 확인해 주세요.'); return }
    const filters: AuditLogFilters = { actionType: draft.actionType || undefined, actorUserId, targetType: draft.targetType || undefined, targetId, from: draft.from || undefined, to: draft.to || undefined }
    setAppliedFilters(filters); void loadLogs(filters, 0, false)
  }

  const hasMore = page + 1 < totalPages
  const filtered = Object.values(appliedFilters).some((value) => value !== undefined)
  function toggleDetail(id: number) { setExpandedIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next }) }

  return <div className={styles.page}><h1>감사 로그</h1>
    <form onSubmit={applyFilters}><fieldset className={styles.filters}><legend>조회 조건</legend><div className={styles.filterGrid}>
      <label>행위 유형<select value={draft.actionType} onChange={(event) => setDraft({ ...draft, actionType: event.target.value as DraftFilters['actionType'] })}><option value="">전체</option>{ACTIONS.map((action) => <option value={action} key={action}>{actionLabel(action)}</option>)}</select></label>
      <label>대상 유형<select value={draft.targetType} onChange={(event) => setDraft({ ...draft, targetType: event.target.value as DraftFilters['targetType'] })}><option value="">전체</option>{TARGETS.map((target) => <option value={target} key={target}>{targetTypeLabel(target)}</option>)}</select></label>
      <label>행위자 사용자 ID (선택, 내부 식별자)<input inputMode="numeric" value={draft.actorUserIdText} onChange={(event) => setDraft({ ...draft, actorUserIdText: event.target.value })} /></label>
      <label>대상 ID (선택, 내부 식별자)<input inputMode="numeric" value={draft.targetIdText} onChange={(event) => setDraft({ ...draft, targetIdText: event.target.value })} /></label>
      <label>시작 일시<input type="datetime-local" value={draft.from} onChange={(event) => setDraft({ ...draft, from: event.target.value })} /></label>
      <label>종료 일시<input type="datetime-local" value={draft.to} onChange={(event) => setDraft({ ...draft, to: event.target.value })} /></label>
    </div>{filterError && <p className={styles.error} role="alert">{filterError}</p>}<div className={styles.actions}><Button type="submit">조회</Button></div></fieldset></form>
    <section className={styles.results} aria-label="감사 로그 목록">{initialLoading ? <div role="status" aria-label="감사 로그를 불러오는 중"><Skeleton lines={8} /></div> : error ? <div className={styles.errorState}><p className={styles.error} role="alert">{error}</p><Button variant="secondary" onClick={() => void loadLogs(appliedFilters, 0, false)}>다시 시도</Button></div> : entries.length === 0 ? <p className={styles.empty}>{filtered ? '조건에 맞는 감사 로그가 없습니다.' : '감사 로그가 없습니다.'}</p> : <>
      <ul className={styles.list}>{entries.map((entry) => { const expanded = expandedIds.has(entry.auditLogId); return <li className={styles.card} key={entry.auditLogId}><div className={styles.cardHeader}><div><time dateTime={entry.createdAt}>{formatCreatedAt(entry.createdAt)}</time><h2>{actionLabel(entry.actionType)}</h2></div><Badge variant="neutral">{targetTypeLabel(entry.targetType)} #{entry.targetId}</Badge></div><p>행위자 사용자 ID: {entry.actorUserId}</p><Button type="button" size="sm" variant="secondary" aria-expanded={expanded} onClick={() => toggleDetail(entry.auditLogId)}>{expanded ? '접기' : '상세 보기'}</Button>{expanded && <div className={styles.details}><AuditValue title="이전 값" raw={entry.previousValue} /><AuditValue title="변경 값" raw={entry.changedValue} />{entry.requestIp && <p><strong>요청 IP</strong> {entry.requestIp}</p>}{entry.requestId && <p><strong>요청 ID</strong> {entry.requestId}</p>}</div>}</li> })}</ul>
      {(hasMore || loadMoreError) && <div className={styles.loadMore}>{loadMoreError && <p className={styles.error} role="alert">{loadMoreError}</p>}{hasMore && <Button type="button" variant="secondary" loading={loadingMore} disabled={loadingMore} onClick={() => { if (!loadingMoreRef.current) void loadLogs(appliedFilters, page + 1, true) }}>감사 로그 더 보기</Button>}</div>}
    </>}</section>
  </div>
}
