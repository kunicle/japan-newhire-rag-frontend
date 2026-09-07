import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, Skeleton } from '../../shared/ui'
import {
  enrollmentStatusBadgeVariant,
  enrollmentStatusLabel,
  formatProgressRate,
  mapManagerEducationErrorMessage,
} from './educationHelpers'
import { fetchTeamEducation } from './managerEducationApi'
import type { ManagerEducationPage as ManagerEducationPageData } from './educationTypes'
import styles from './ManagerEducationPage.module.css'

const PAGE_SIZE = 20
const LIST_ERROR_MESSAGE = '팀 교육 현황을 불러오지 못했습니다.'
const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? '날짜 정보 없음' : dateFormatter.format(date)
}

export function ManagerEducationPage() {
  const [pageData, setPageData] = useState<ManagerEducationPageData | null>(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const latestFetchIdRef = useRef(0)
  const mountedRef = useRef(false)

  const loadEducation = useCallback(async () => {
    const requestId = ++latestFetchIdRef.current
    setLoading(true)
    setError(null)
    try {
      const response = await fetchTeamEducation(page, PAGE_SIZE)
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setPageData(response)
    } catch (fetchError) {
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setPageData(null)
      setError(mapManagerEducationErrorMessage(fetchError, LIST_ERROR_MESSAGE))
    } finally {
      if (mountedRef.current && requestId === latestFetchIdRef.current) {
        setLoading(false)
      }
    }
  }, [page])

  useEffect(() => {
    mountedRef.current = true
    queueMicrotask(() => void loadEducation())
    return () => {
      mountedRef.current = false
      latestFetchIdRef.current += 1
    }
  }, [loadEducation])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>팀 교육 현황</h1>
        <p className={styles.description}>관리 중인 직원들의 교육 진행 상태를 확인합니다.</p>
      </header>

      {loading ? (
        <div className={styles.skeletonList} role="status" aria-label="팀 교육 현황을 불러오는 중">
          <Skeleton lines={5} /><Skeleton lines={5} /><Skeleton lines={5} />
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <p className={styles.error} role="alert">{error}</p>
          <Button variant="secondary" onClick={() => void loadEducation()}>다시 시도</Button>
        </div>
      ) : pageData && pageData.content.length === 0 ? (
        <EmptyState
          title="관리 중인 직원의 교육 현황이 없습니다."
          description="관리 대상 직원에게 교육이 배정되면 이곳에서 확인할 수 있습니다."
        />
      ) : pageData ? (
        <>
          <ul className={styles.educationGrid} aria-label="팀 교육 현황 목록">
            {pageData.content.map((item) => (
              <li className={styles.educationItem} key={item.enrollmentId}>
                <Card padding="none" className={styles.educationCard}>
                  <Link className={styles.educationLink} to={`/manager/education/${item.employeeId}`}>
                    <div className={styles.itemHeader}>
                      <h2 className={styles.employeeName}>{item.employeeName}</h2>
                      <Badge variant={enrollmentStatusBadgeVariant(item.status)}>
                        {enrollmentStatusLabel(item.status)}
                      </Badge>
                    </div>
                    <p className={styles.departmentName}>{item.departmentName}</p>
                    <p className={styles.courseName}>{item.courseName}</p>
                    <div className={styles.progressText}>
                      <span>진행률</span>
                      <span>{formatProgressRate(item.progressRate)}</span>
                    </div>
                    <div
                      className={styles.progressTrack}
                      role="progressbar"
                      aria-label={`${item.employeeName} ${item.courseName} 진행률`}
                      aria-valuenow={item.progressRate}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div className={styles.progressFill} style={{ width: `${item.progressRate}%` }} />
                    </div>
                    <time className={styles.dueDate} dateTime={item.dueDate}>
                      학습 기한 {formatDate(item.dueDate)}
                    </time>
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
          {pageData.totalPages > 0 && (
            <nav className={styles.pagination} aria-label="팀 교육 현황 페이지">
              <Button variant="secondary" disabled={pageData.first || pageData.page === 0}
                onClick={() => setPage(pageData.page - 1)}>이전</Button>
              <span>페이지 {pageData.page + 1} / {pageData.totalPages}</span>
              <Button variant="secondary" disabled={pageData.last}
                onClick={() => setPage(pageData.page + 1)}>다음</Button>
            </nav>
          )}
        </>
      ) : null}
    </div>
  )
}
