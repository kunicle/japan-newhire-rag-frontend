import { useCallback, useEffect, useRef, useState } from 'react'
import { Badge, Button, EmptyState, Skeleton } from '../../shared/ui'
import {
  completeOnboardingTask,
  fetchMyOnboarding,
  startOnboardingTask,
} from './onboardingApi'
import {
  mapOnboardingErrorMessage,
  onboardingStatusBadgeVariant,
  onboardingStatusLabel,
} from './onboardingHelpers'
import type { MyOnboardingItem } from './onboardingTypes'
import styles from './MyOnboardingPage.module.css'

const LOAD_ERROR_MESSAGE = '온보딩 정보를 불러오지 못했습니다.'
const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})
const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? '날짜 정보 없음' : dateFormatter.format(date)
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '날짜 정보 없음' : dateTimeFormatter.format(date)
}

export function MyOnboardingPage() {
  const [items, setItems] = useState<MyOnboardingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingActionIds, setPendingActionIds] = useState<Set<number>>(new Set())
  const [actionErrorByAssignmentId, setActionErrorByAssignmentId] =
    useState<Map<number, string>>(new Map())
  const pendingActionIdsRef = useRef<Set<number>>(new Set())
  const latestFetchIdRef = useRef(0)
  const mountedRef = useRef(false)

  const loadOnboarding = useCallback(async () => {
    const requestId = ++latestFetchIdRef.current
    setLoading(true)
    setError(null)
    try {
      const response = await fetchMyOnboarding()
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setItems(response)
    } catch (fetchError) {
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setError(mapOnboardingErrorMessage(fetchError, LOAD_ERROR_MESSAGE))
    } finally {
      if (mountedRef.current && requestId === latestFetchIdRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const pendingIds = pendingActionIdsRef.current
    mountedRef.current = true
    queueMicrotask(() => void loadOnboarding())
    return () => {
      mountedRef.current = false
      latestFetchIdRef.current += 1
      pendingIds.clear()
    }
  }, [loadOnboarding])

  async function handleTaskAction(
    assignmentId: number,
    action: (id: number) => Promise<MyOnboardingItem>,
    fallback: string,
  ) {
    if (pendingActionIdsRef.current.has(assignmentId)) return

    pendingActionIdsRef.current.add(assignmentId)
    setPendingActionIds(new Set(pendingActionIdsRef.current))
    setActionErrorByAssignmentId((current) => {
      const next = new Map(current)
      next.delete(assignmentId)
      return next
    })

    let writeSucceeded = false
    try {
      await action(assignmentId)
      writeSucceeded = true
    } catch (actionError) {
      if (mountedRef.current) {
        setActionErrorByAssignmentId((current) => {
          const next = new Map(current)
          next.set(assignmentId, mapOnboardingErrorMessage(actionError, fallback))
          return next
        })
      }
    }

    if (writeSucceeded && mountedRef.current) {
      await loadOnboarding()
    }

    pendingActionIdsRef.current.delete(assignmentId)
    if (mountedRef.current) {
      setPendingActionIds(new Set(pendingActionIdsRef.current))
    }
  }

  const completedCount = items.filter(
    (item) => item.completionStatus === 'COMPLETED',
  ).length

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>내 온보딩</h1>
        <p className={styles.description}>배정된 온보딩 할 일을 확인하고 진행합니다.</p>
      </header>

      {loading && items.length === 0 ? (
        <div className={styles.skeletons} role="status" aria-label="온보딩 정보를 불러오는 중">
          <Skeleton lines={3} />
          <Skeleton lines={5} />
          <Skeleton lines={5} />
        </div>
      ) : error && items.length === 0 ? (
        <div className={styles.errorState}>
          <p className={styles.error} role="alert">{error}</p>
          <Button variant="secondary" onClick={() => void loadOnboarding()}>다시 시도</Button>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="배정된 온보딩이 없습니다."
          description="새로운 온보딩 할 일이 배정되면 이곳에서 확인할 수 있습니다."
        />
      ) : (
        <>
          {error && (
            <div className={styles.refreshError}>
              <p className={styles.error} role="alert">{error}</p>
              <Button size="sm" variant="secondary" onClick={() => void loadOnboarding()}>
                다시 시도
              </Button>
            </div>
          )}
          <p className={styles.summary}>완료 {completedCount} / 전체 {items.length}</p>
          <section aria-labelledby="onboarding-tasks-title">
            <h2 className={styles.sectionTitle} id="onboarding-tasks-title">온보딩 할 일</h2>
            <ol className={styles.taskList}>
              {items.map((item) => {
                const assignmentId = item.onboardingAssignmentId
                const pending = pendingActionIds.has(assignmentId)
                const actionError = actionErrorByAssignmentId.get(assignmentId)
                const cancelled = item.assignmentStatus === 'CANCELLED'

                return (
                  <li className={styles.taskItem} key={assignmentId}>
                    <div className={styles.taskHeader}>
                      <h3 className={styles.taskTitle}>{item.taskTitle}</h3>
                      <Badge variant={onboardingStatusBadgeVariant(item.completionStatus)}>
                        {onboardingStatusLabel(item.completionStatus)}
                      </Badge>
                      {item.overdue && <Badge variant="danger">지연</Badge>}
                      {cancelled && <Badge variant="neutral">취소됨</Badge>}
                    </div>
                    <p className={styles.taskDescription}>{item.taskDescription}</p>
                    <dl className={styles.taskDates}>
                      <div><dt>배정일</dt><dd>{formatDate(item.assignedDate)}</dd></div>
                      <div><dt>마감일</dt><dd>{formatDate(item.dueDate)}</dd></div>
                      {item.completedAt && (
                        <div><dt>완료일시</dt><dd>{formatDateTime(item.completedAt)}</dd></div>
                      )}
                    </dl>
                    {!cancelled && item.completionStatus === 'NOT_STARTED' && (
                      <Button
                        size="sm"
                        loading={pending}
                        disabled={pending}
                        onClick={() => void handleTaskAction(
                          assignmentId,
                          startOnboardingTask,
                          '온보딩 시작에 실패했습니다.',
                        )}
                      >
                        시작
                      </Button>
                    )}
                    {!cancelled && item.completionStatus === 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        loading={pending}
                        disabled={pending}
                        onClick={() => void handleTaskAction(
                          assignmentId,
                          completeOnboardingTask,
                          '온보딩 완료 처리에 실패했습니다.',
                        )}
                      >
                        완료
                      </Button>
                    )}
                    {actionError && <p className={styles.error} role="alert">{actionError}</p>}
                  </li>
                )
              })}
            </ol>
          </section>
        </>
      )}
    </div>
  )
}
