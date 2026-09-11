import { useCallback, useEffect, useRef, useState } from 'react'
import { AppError } from '../../shared/api/errors'
import { Badge, Button, Skeleton } from '../../shared/ui'
import styles from '../audit/AuditPage.module.css'
import { fetchSystemErrors } from './systemErrorsApi'
import type { SystemErrorEntry } from './types'

const PAGE_SIZE = 20
const dateFormatter = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })
function errorMessage(error: unknown): string { return error instanceof AppError && error.status === 403 ? '시스템 오류를 조회할 권한이 없습니다.' : '시스템 오류를 불러오지 못했습니다.' }
function formatDate(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? '날짜 정보 없음' : dateFormatter.format(date) }

export function SystemErrorsPage() {
  const [entries, setEntries] = useState<SystemErrorEntry[]>([]); const [page, setPage] = useState(0); const [totalPages, setTotalPages] = useState(0); const [loading, setLoading] = useState(true); const [loadingMore, setLoadingMore] = useState(false); const [error, setError] = useState<string | null>(null); const mountedRef = useRef(false)
  const load = useCallback(async (requestedPage: number, append: boolean) => { if (append) setLoadingMore(true); else setLoading(true); setError(null); try { const response = await fetchSystemErrors(requestedPage, PAGE_SIZE); if (!mountedRef.current) return; setEntries((current) => append ? [...current, ...response.content] : response.content); setPage(response.page); setTotalPages(response.totalPages) } catch (loadError) { if (mountedRef.current) setError(errorMessage(loadError)) } finally { if (mountedRef.current) { setLoading(false); setLoadingMore(false) } } }, [])
  useEffect(() => { mountedRef.current = true; queueMicrotask(() => { if (mountedRef.current) void load(0, false) }); return () => { mountedRef.current = false } }, [load])
  const hasMore = page + 1 < totalPages
  return <div className={styles.page}><header className={styles.pageHeader}><h1>시스템 오류</h1><p>외부 AI API 호출에서 최종 실패한 오류를 최신순으로 확인합니다.</p></header><section className={styles.results} aria-label="시스템 오류 목록">{loading ? <div role="status"><Skeleton lines={8} /></div> : error ? <div className={styles.errorState}><p className={styles.error} role="alert">{error}</p><Button variant="secondary" onClick={() => void load(0, false)}>다시 시도</Button></div> : entries.length === 0 ? <p className={styles.empty}>기록된 시스템 오류가 없습니다.</p> : <><ul className={styles.list}>{entries.map((entry) => <li className={styles.card} key={entry.systemErrorLogId}><div className={styles.cardHeader}><div><time dateTime={entry.occurredAt}>{formatDate(entry.occurredAt)}</time><h2>{entry.errorType}</h2></div><Badge variant="neutral">{entry.errorStatus}</Badge></div><p>출처: {entry.errorSource} · 재시도: {entry.retryCount}회</p><div className={styles.details}><p><strong>오류 메시지</strong> {entry.errorMessage}</p>{entry.errorCode && <p><strong>오류 코드</strong> {entry.errorCode}</p>}{entry.externalApiCallLogId && <p><strong>외부 호출 로그 ID</strong> {entry.externalApiCallLogId}</p>}{entry.appUserId && <p><strong>사용자 ID</strong> {entry.appUserId}</p>}</div></li>)}</ul>{hasMore && <div className={styles.loadMore}><Button variant="secondary" loading={loadingMore} disabled={loadingMore} onClick={() => void load(page + 1, true)}>시스템 오류 더 보기</Button></div>}</>}</section></div>
}
