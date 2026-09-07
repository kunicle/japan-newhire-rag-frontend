import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, Skeleton } from '../../shared/ui'
import { fetchMyCourses } from './educationApi'
import {
  enrollmentStatusBadgeVariant,
  enrollmentStatusLabel,
  formatProgressRate,
  mapEducationErrorMessage,
} from './educationHelpers'
import type { MyCoursePage } from './educationTypes'
import styles from './MyEducationPage.module.css'

const PAGE_SIZE = 20
const LIST_ERROR_MESSAGE = '교육 과정 목록을 불러오지 못했습니다.'
const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? '날짜 정보 없음' : dateFormatter.format(date)
}

export function MyEducationPage() {
  const [pageData, setPageData] = useState<MyCoursePage | null>(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const latestFetchIdRef = useRef(0)
  const mountedRef = useRef(false)

  const loadCourses = useCallback(async () => {
    const requestId = ++latestFetchIdRef.current
    setLoading(true)
    setError(null)
    try {
      const response = await fetchMyCourses(page, PAGE_SIZE)
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setPageData(response)
    } catch (fetchError) {
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setPageData(null)
      setError(mapEducationErrorMessage(fetchError, LIST_ERROR_MESSAGE))
    } finally {
      if (mountedRef.current && requestId === latestFetchIdRef.current) {
        setLoading(false)
      }
    }
  }, [page])

  useEffect(() => {
    mountedRef.current = true
    queueMicrotask(() => void loadCourses())
    return () => {
      mountedRef.current = false
      latestFetchIdRef.current += 1
    }
  }, [loadCourses])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>내 교육</h1>
        <p className={styles.description}>배정된 교육 과정과 학습 진행 상태를 확인합니다.</p>
      </header>

      {loading ? (
        <div className={styles.skeletonList} role="status" aria-label="교육 과정 목록을 불러오는 중">
          <Skeleton lines={4} /><Skeleton lines={4} /><Skeleton lines={4} />
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <p className={styles.error} role="alert">{error}</p>
          <Button variant="secondary" onClick={() => void loadCourses()}>다시 시도</Button>
        </div>
      ) : pageData && pageData.content.length === 0 ? (
        <EmptyState
          title="배정된 교육 과정이 없습니다."
          description="새 교육 과정이 배정되면 이곳에서 확인할 수 있습니다."
        />
      ) : pageData ? (
        <>
          <ul className={styles.courseGrid} aria-label="교육 과정 목록">
            {pageData.content.map((course) => (
              <li key={course.enrollmentId} className={styles.courseItem}>
                <Card padding="none" className={styles.courseCard}>
                  <Link className={styles.courseLink} to={`/me/education/${course.enrollmentId}`}>
                    <div className={styles.courseHeader}>
                      <h2 className={styles.courseTitle}>{course.courseName}</h2>
                      <Badge variant={enrollmentStatusBadgeVariant(course.status)}>
                        {enrollmentStatusLabel(course.status)}
                      </Badge>
                    </div>
                    <Badge variant={course.required ? 'warning' : 'neutral'}>
                      {course.required ? '필수' : '선택'}
                    </Badge>
                    <div className={styles.progressText}>
                      <span>진행률</span>
                      <span>{formatProgressRate(course.progressRate)}</span>
                    </div>
                    <div
                      className={styles.progressTrack}
                      role="progressbar"
                      aria-label={`${course.courseName} 진행률`}
                      aria-valuenow={course.progressRate}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className={styles.progressFill}
                        style={{ width: `${course.progressRate}%` }}
                      />
                    </div>
                    <time className={styles.dueDate} dateTime={course.enrollmentDueDate}>
                      학습 기한 {formatDate(course.enrollmentDueDate)}
                    </time>
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
          {pageData.totalPages > 0 && (
            <nav className={styles.pagination} aria-label="교육 과정 페이지">
              <Button
                variant="secondary"
                disabled={pageData.first || pageData.page === 0}
                onClick={() => setPage(pageData.page - 1)}
              >
                이전
              </Button>
              <span>페이지 {pageData.page + 1} / {pageData.totalPages}</span>
              <Button
                variant="secondary"
                disabled={pageData.last}
                onClick={() => setPage(pageData.page + 1)}
              >
                다음
              </Button>
            </nav>
          )}
        </>
      ) : null}
    </div>
  )
}
