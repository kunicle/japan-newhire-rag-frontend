import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppError } from '../../shared/api/errors'
import { Badge, Button, EmptyState, Skeleton } from '../../shared/ui'
import { useAuth } from '../auth/AuthContext'
import {
  assignManagedOnboardingTask,
  completeManagedOnboarding,
  fetchAssignableOnboardingEmployees,
  fetchManagedOnboardingProgress,
  fetchManagedOnboardingTasks,
  startManagedOnboarding,
} from './onboardingManagementApi'
import type {
  ManagedOnboardingTask,
  OnboardingAssignableEmployee,
  OnboardingManagementItem,
  OnboardingManagementPage,
} from './onboardingManagementTypes'
import {
  onboardingStatusBadgeVariant,
  onboardingStatusLabel,
} from './onboardingHelpers'
import styles from './OnboardingManagementPage.module.css'

const PAGE_SIZE = 20

function errorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof AppError)) return fallback
  if (error.status === 403) return '관리 권한이 없거나 관리 범위를 벗어난 직원입니다.'
  if (error.status === 404) return '요청한 오늘 할 일 정보를 찾을 수 없습니다.'
  if (error.status === 409) return '현재 상태에서는 변경할 수 없습니다.'
  return fallback
}

export function OnboardingManagementPage() {
  const { roles } = useAuth()
  const isManager = roles.includes('MANAGER')
  const [progress, setProgress] = useState<OnboardingManagementPage | null>(null)
  const [page, setPage] = useState(0)
  const [tasks, setTasks] = useState<ManagedOnboardingTask[]>([])
  const [directReports, setDirectReports] = useState<OnboardingAssignableEmployee[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const pendingRef = useRef(false)
  const mountedRef = useRef(false)

  const loadProgress = useCallback(async (requestedPage: number) => {
    setLoading(true)
    setLoadError(null)
    try {
      const response = await fetchManagedOnboardingProgress(
        requestedPage,
        PAGE_SIZE,
      )
      if (mountedRef.current) setProgress(response)
    } catch (error) {
      if (mountedRef.current) {
        setLoadError(errorMessage(error, '진행 상태를 불러오지 못했습니다.'))
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    queueMicrotask(() => void loadProgress(page))
    return () => {
      mountedRef.current = false
      pendingRef.current = false
    }
  }, [loadProgress, page])

  useEffect(() => {
    if (!isManager) return
    let cancelled = false
    Promise.all([
      fetchManagedOnboardingTasks(0, 100),
      fetchAssignableOnboardingEmployees(),
    ]).then(([taskPage, employees]) => {
      if (cancelled) return
      setTasks(taskPage.content)
      setDirectReports(employees)
    }).catch((error) => {
      if (!cancelled) {
        setActionError(errorMessage(
          error,
          '부여에 필요한 정보를 불러오지 못했습니다.',
        ))
      }
    })
    return () => {
      cancelled = true
    }
  }, [isManager])

  async function runAction(
    action: () => Promise<unknown>,
    failureMessage: string,
  ) {
    if (pendingRef.current) return
    pendingRef.current = true
    setPending(true)
    setActionError(null)
    setSuccess(null)
    try {
      await action()
      if (mountedRef.current) await loadProgress(page)
    } catch (error) {
      if (mountedRef.current) {
        setActionError(errorMessage(error, failureMessage))
      }
    } finally {
      pendingRef.current = false
      if (mountedRef.current) setPending(false)
    }
  }

  async function handleAssign() {
    const taskId = Number(selectedTaskId)
    const employeeId = Number(selectedEmployeeId)
    if (!taskId || !employeeId) return
    await runAction(async () => {
      const result = await assignManagedOnboardingTask(
        taskId,
        [employeeId],
      )
      if (mountedRef.current) {
        setSuccess(
          result.successCount > 0
            ? '오늘 할 일을 부여했습니다.'
            : '이미 부여된 오늘 할 일입니다.',
        )
        setSelectedEmployeeId('')
      }
    }, '오늘 할 일 부여에 실패했습니다.')
  }

  const summary = useMemo(() => {
    const items = progress?.content ?? []
    return {
      completed: items.filter((item) => item.completionStatus === 'COMPLETED').length,
      total: progress?.totalElements ?? 0,
    }
  }, [progress])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>오늘 할 일 진행 관리</h1>
        <p>
          {isManager
            ? '직속 신입사원에게 오늘 할 일을 부여하고 진행 상태를 관리합니다.'
            : '전체 신입사원의 오늘 할 일 진행 상태를 관리합니다.'}
        </p>
      </header>

      {isManager && (
        <section className={styles.panel} aria-labelledby="assignment-title">
          <h2 id="assignment-title">오늘 할 일 부여</h2>
          <div className={styles.assignmentFields}>
            <label>
              오늘 할 일
              <select
                value={selectedTaskId}
                disabled={pending}
                onChange={(event) => setSelectedTaskId(event.target.value)}
              >
                <option value="">선택</option>
                {tasks.map((task) => (
                  <option key={task.taskId} value={task.taskId}>
                    {task.taskTitle}
                  </option>
                ))}
              </select>
            </label>
            <label>
              직속 신입사원
              <select
                value={selectedEmployeeId}
                disabled={pending}
                onChange={(event) => setSelectedEmployeeId(event.target.value)}
              >
                <option value="">선택</option>
                {directReports.map((employee) => (
                  <option key={employee.employeeId} value={employee.employeeId}>
                    {employee.employeeName} · {employee.departmentName}
                  </option>
                ))}
              </select>
            </label>
            <Button
              loading={pending}
              disabled={pending || !selectedTaskId || !selectedEmployeeId}
              onClick={() => void handleAssign()}
            >
              부여
            </Button>
          </div>
        </section>
      )}

      {actionError && <p className={styles.error} role="alert">{actionError}</p>}
      {success && <p className={styles.success} role="status">{success}</p>}

      <section className={styles.panel} aria-labelledby="progress-title">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="progress-title">직원별 진행 상태</h2>
            <p>완료 {summary.completed} / 전체 {summary.total}</p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            disabled={loading || pending}
            onClick={() => void loadProgress(page)}
          >
            새로고침
          </Button>
        </div>

        {loading && !progress ? (
          <Skeleton lines={5} />
        ) : loadError && !progress ? (
          <div>
            <p className={styles.error} role="alert">{loadError}</p>
            <Button variant="secondary" onClick={() => void loadProgress(page)}>
              다시 시도
            </Button>
          </div>
        ) : progress?.content.length === 0 ? (
          <EmptyState
            title="관리할 오늘 할 일이 없습니다."
            description="오늘 할 일을 부여하면 직원별 진행 상태가 표시됩니다."
          />
        ) : (
          <ul className={styles.list}>
            {progress?.content.map((item: OnboardingManagementItem) => (
              <li className={styles.item} key={item.onboardingAssignmentId}>
                <div className={styles.itemHeading}>
                  <div>
                    <strong>{item.employeeName}</strong>
                    <span>{item.employeeDepartmentName}</span>
                  </div>
                  <Badge variant={onboardingStatusBadgeVariant(item.completionStatus)}>
                    {onboardingStatusLabel(item.completionStatus)}
                  </Badge>
                  {item.overdue && <Badge variant="danger">지연</Badge>}
                </div>
                <h3>{item.taskTitle}</h3>
                <p>{item.taskDescription}</p>
                <p className={styles.meta}>배정일 {item.assignedDate} · 마감일 {item.dueDate}</p>
                {item.assignmentStatus !== 'CANCELLED' && (
                  <div className={styles.actions}>
                    {item.completionStatus === 'NOT_STARTED' && (
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() => void runAction(
                          () => startManagedOnboarding(item.onboardingAssignmentId),
                          '진행 중 변경에 실패했습니다.',
                        )}
                      >
                        진행 중으로 변경
                      </Button>
                    )}
                    {item.completionStatus === 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() => void runAction(
                          () => completeManagedOnboarding(item.onboardingAssignmentId),
                          '완료 변경에 실패했습니다.',
                        )}
                      >
                        완료로 변경
                      </Button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {progress && progress.totalPages > 0 && (
          <nav className={styles.pagination} aria-label="진행 상태 페이지">
            <Button
              variant="secondary"
              disabled={progress.first || loading || pending}
              onClick={() => setPage(progress.page - 1)}
            >
              이전
            </Button>
            <span>{progress.page + 1} / {progress.totalPages}</span>
            <Button
              variant="secondary"
              disabled={progress.last || loading || pending}
              onClick={() => setPage(progress.page + 1)}
            >
              다음
            </Button>
          </nav>
        )}
      </section>
    </div>
  )
}
