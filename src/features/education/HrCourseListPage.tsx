import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, Skeleton } from '../../shared/ui'
import { fetchHrCourses } from './hrCourseApi'
import {
  coursePublicationBadgeVariant,
  coursePublicationLabel,
  mapHrCourseErrorMessage,
} from './hrCourseHelpers'
import type { HrCoursePage } from './hrCourseTypes'
import styles from './HrCourseListPage.module.css'

const PAGE_SIZE = 20
const LIST_ERROR_MESSAGE = '교육 과정 목록을 불러오지 못했습니다.'
const dateFormatter = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeZone: 'UTC' })
function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? '날짜 정보 없음' : dateFormatter.format(date)
}

export function HrCourseListPage() {
  const [pageData, setPageData] = useState<HrCoursePage | null>(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const latestFetchIdRef = useRef(0)
  const mountedRef = useRef(false)

  const loadCourses = useCallback(async () => {
    const requestId = ++latestFetchIdRef.current
    setLoading(true); setError(null)
    try {
      const response = await fetchHrCourses(page, PAGE_SIZE)
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setPageData(response)
    } catch (fetchError) {
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setPageData(null)
      setError(mapHrCourseErrorMessage(fetchError, LIST_ERROR_MESSAGE))
    } finally {
      if (mountedRef.current && requestId === latestFetchIdRef.current) setLoading(false)
    }
  }, [page])

  useEffect(() => {
    mountedRef.current = true
    queueMicrotask(() => void loadCourses())
    return () => { mountedRef.current = false; latestFetchIdRef.current += 1 }
  }, [loadCourses])

  return <div className={styles.page}>
    <header className={styles.header}>
      <div><h1 className={styles.title}>교육 과정 관리</h1><p className={styles.description}>교육 과정과 학습 모듈을 만들고 관리합니다.</p></div>
      <Link className={styles.primaryLink} to="/hr/courses/new">새 과정</Link>
    </header>
    {loading ? <div className={styles.skeletons} role="status" aria-label="교육 과정 목록을 불러오는 중"><Skeleton lines={4}/><Skeleton lines={4}/></div>
      : error ? <div className={styles.errorState}><p className={styles.error} role="alert">{error}</p><Button variant="secondary" onClick={() => void loadCourses()}>다시 시도</Button></div>
      : pageData && pageData.content.length === 0 ? <div className={styles.emptyState}><EmptyState title="등록된 교육 과정이 없습니다." description="새 교육 과정을 만들어 시작하세요."/><Link className={styles.primaryLink} to="/hr/courses/new">새 과정 만들기</Link></div>
      : pageData ? <>
        <ul className={styles.grid} aria-label="교육 과정 목록">{pageData.content.map((course) => <li key={course.courseId}>
          <Card padding="none" className={styles.card}><Link className={styles.cardLink} to={`/hr/courses/${course.courseId}`}>
            <div className={styles.cardHeader}><h2 className={styles.cardTitle}>{course.courseName}</h2><Badge variant={coursePublicationBadgeVariant(course.publicationStatus)}>{coursePublicationLabel(course.publicationStatus)}</Badge></div>
            <Badge variant={course.required ? 'warning' : 'neutral'}>{course.required ? '필수' : '선택'}</Badge>
            <p className={styles.dates}>{formatDate(course.trainingStartDate)} ~ {formatDate(course.trainingEndDate)}</p>
          </Link></Card>
        </li>)}</ul>
        {pageData.totalPages > 0 && <nav className={styles.pagination} aria-label="교육 과정 페이지">
          <Button variant="secondary" disabled={pageData.first || pageData.page === 0} onClick={() => setPage(pageData.page - 1)}>이전</Button>
          <span>페이지 {pageData.page + 1} / {pageData.totalPages}</span>
          <Button variant="secondary" disabled={pageData.last} onClick={() => setPage(pageData.page + 1)}>다음</Button>
        </nav>}
      </> : null}
  </div>
}
