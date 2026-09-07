import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, Skeleton } from '../../shared/ui'
import {
  enrollmentStatusBadgeVariant,
  enrollmentStatusLabel,
  formatProgressRate,
  mapManagerEducationErrorMessage,
} from './educationHelpers'
import { fetchEmployeeCourses } from './managerEducationApi'
import type { ManagerEducationPage } from './educationTypes'
import styles from './ManagerEmployeeEducationPage.module.css'

const PAGE_SIZE = 20
const DETAIL_ERROR_MESSAGE = '직원의 교육 현황을 불러오지 못했습니다.'
const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? '날짜 정보 없음' : dateFormatter.format(date)
}

export function ManagerEmployeeEducationPage() {
  const { employeeId: employeeIdParam } = useParams()
  const employeeId = Number(employeeIdParam)
  const validEmployeeId = Number.isInteger(employeeId) && employeeId > 0
  const [pageState, setPageState] = useState({ employeeId, page: 0 })
  const page = pageState.employeeId === employeeId ? pageState.page : 0
  const [pageData, setPageData] = useState<ManagerEducationPage | null>(null)
  const [loading, setLoading] = useState(validEmployeeId)
  const [error, setError] = useState<string | null>(null)
  const latestFetchIdRef = useRef(0)
  const mountedRef = useRef(false)

  const loadEducation = useCallback(async () => {
    if (!validEmployeeId) return
    const requestId = ++latestFetchIdRef.current
    setLoading(true)
    setError(null)
    setPageData(null)
    try {
      const response = await fetchEmployeeCourses(employeeId, page, PAGE_SIZE)
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setPageData(response)
    } catch (fetchError) {
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setError(mapManagerEducationErrorMessage(fetchError, DETAIL_ERROR_MESSAGE))
    } finally {
      if (mountedRef.current && requestId === latestFetchIdRef.current) {
        setLoading(false)
      }
    }
  }, [employeeId, page, validEmployeeId])

  useEffect(() => {
    mountedRef.current = true
    if (validEmployeeId) queueMicrotask(() => void loadEducation())
    return () => {
      mountedRef.current = false
      latestFetchIdRef.current += 1
    }
  }, [loadEducation, validEmployeeId])

  if (!validEmployeeId) {
    return (
      <div className={styles.page}>
        <p className={styles.error} role="alert">잘못된 직원 정보입니다.</p>
        <Link className={styles.backLink} to="/manager/education">팀 교육 현황으로 돌아가기</Link>
      </div>
    )
  }

  const employee = pageData?.content[0]

  return (
    <div className={styles.page}>
      <Link className={styles.backLink} to="/manager/education">팀 교육 현황으로 돌아가기</Link>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {employee ? `${employee.employeeName} 교육 현황` : '직원 교육 현황'}
        </h1>
        {employee && <p className={styles.description}>{employee.departmentName}</p>}
      </header>

      {loading ? (
        <div className={styles.skeletonList} role="status" aria-label="직원 교육 현황을 불러오는 중">
          <Skeleton lines={4} /><Skeleton lines={4} /><Skeleton lines={4} />
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <p className={styles.error} role="alert">{error}</p>
          <Button variant="secondary" onClick={() => void loadEducation()}>다시 시도</Button>
        </div>
      ) : pageData && pageData.content.length === 0 ? (
        <EmptyState
          title="해당 직원에게 배정된 교육 과정이 없습니다."
          description="교육 과정이 배정되면 이곳에서 확인할 수 있습니다."
        />
      ) : pageData ? (
        <>
          <ul className={styles.courseList} aria-label="직원 교육 과정 목록">
            {pageData.content.map((item) => (
              <li key={item.enrollmentId}>
                <Card className={styles.courseCard}>
                  <div className={styles.courseHeader}>
                    <h2 className={styles.courseTitle}>{item.courseName}</h2>
                    <Badge variant={enrollmentStatusBadgeVariant(item.status)}>
                      {enrollmentStatusLabel(item.status)}
                    </Badge>
                  </div>
                  <div className={styles.progressText}>
                    <span>진행률</span>
                    <span>{formatProgressRate(item.progressRate)}</span>
                  </div>
                  <div
                    className={styles.progressTrack}
                    role="progressbar"
                    aria-label={`${item.courseName} 진행률`}
                    aria-valuenow={item.progressRate}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div className={styles.progressFill} style={{ width: `${item.progressRate}%` }} />
                  </div>
                  <time className={styles.dueDate} dateTime={item.dueDate}>
                    학습 기한 {formatDate(item.dueDate)}
                  </time>
                </Card>
              </li>
            ))}
          </ul>
          {pageData.totalPages > 0 && (
            <nav className={styles.pagination} aria-label="직원 교육 현황 페이지">
              <Button variant="secondary" disabled={pageData.first || pageData.page === 0}
                onClick={() => setPageState({ employeeId, page: pageData.page - 1 })}>이전</Button>
              <span>페이지 {pageData.page + 1} / {pageData.totalPages}</span>
              <Button variant="secondary" disabled={pageData.last}
                onClick={() => setPageState({ employeeId, page: pageData.page + 1 })}>다음</Button>
            </nav>
          )}
        </>
      ) : null}
    </div>
  )
}
