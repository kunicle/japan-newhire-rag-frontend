import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppError } from '../../shared/api/errors'
import { Badge, Button, Skeleton } from '../../shared/ui'
import { fetchOrganization } from '../organization/organizationApi'
import {
  flattenDepartments,
  flattenEmployees,
} from '../organization/organizationHelpers'
import type { OrganizationResponse } from '../organization/types'
import {
  assignOnboardingTask,
  changeOnboardingTaskActivation,
  createOnboardingTask,
  updateOnboardingTask,
} from './hrOnboardingApi'
import { mapHrOnboardingErrorMessage } from './hrOnboardingHelpers'
import type {
  HrOnboardingTask,
  OnboardingAssignmentCreateResult,
  OnboardingTaskFormInput,
} from './hrOnboardingTypes'
import { OnboardingTaskForm } from './OnboardingTaskForm'
import styles from './HrOnboardingPage.module.css'

const ORGANIZATION_ERROR = '조직 정보를 불러오지 못했습니다.'
const ASSIGN_ELIGIBILITY_ERROR =
  '선택한 대상 중 신입사원 자격 조건을 만족하지 않는 직원이 있습니다.'

export function HrOnboardingPage() {
  const [organization, setOrganization] = useState<OrganizationResponse | null>(null)
  const [organizationLoading, setOrganizationLoading] = useState(true)
  const [organizationError, setOrganizationError] = useState<string | null>(null)
  const [activeTask, setActiveTask] = useState<HrOnboardingTask | null>(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [changingActivation, setChangingActivation] = useState(false)
  const [activationError, setActivationError] = useState<string | null>(null)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<number>>(new Set())
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignResult, setAssignResult] =
    useState<OnboardingAssignmentCreateResult | null>(null)
  const organizationFetchIdRef = useRef(0)
  const mountedRef = useRef(false)
  const creatingTaskRef = useRef(false)
  const savingTaskRef = useRef(false)
  const changingActivationRef = useRef(false)
  const assigningRef = useRef(false)

  const loadOrganization = useCallback(async () => {
    const requestId = ++organizationFetchIdRef.current
    setOrganizationLoading(true)
    setOrganizationError(null)
    setOrganization(null)
    try {
      const response = await fetchOrganization()
      if (!mountedRef.current || requestId !== organizationFetchIdRef.current) return
      setOrganization(response)
    } catch (error) {
      if (!mountedRef.current || requestId !== organizationFetchIdRef.current) return
      setOrganizationError(mapHrOnboardingErrorMessage(error, ORGANIZATION_ERROR))
    } finally {
      if (mountedRef.current && requestId === organizationFetchIdRef.current) {
        setOrganizationLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    queueMicrotask(() => void loadOrganization())
    return () => {
      mountedRef.current = false
      organizationFetchIdRef.current += 1
      creatingTaskRef.current = false
      savingTaskRef.current = false
      changingActivationRef.current = false
      assigningRef.current = false
    }
  }, [loadOrganization])

  const departments = useMemo(
    () => flattenDepartments(organization?.departments ?? []),
    [organization],
  )
  const employees = useMemo(
    () => flattenEmployees(organization?.departments ?? []),
    [organization],
  )

  async function handleCreate(input: OnboardingTaskFormInput) {
    if (creatingTaskRef.current) return
    creatingTaskRef.current = true
    setCreating(true)
    setCreateError(null)
    try {
      const response = await createOnboardingTask(input)
      if (mountedRef.current) setActiveTask(response)
    } catch (error) {
      if (mountedRef.current) {
        setCreateError(mapHrOnboardingErrorMessage(
          error,
          '온보딩 태스크 생성에 실패했습니다.',
        ))
      }
    } finally {
      creatingTaskRef.current = false
      if (mountedRef.current) setCreating(false)
    }
  }

  async function handleSave(input: OnboardingTaskFormInput) {
    if (!activeTask || savingTaskRef.current) return
    savingTaskRef.current = true
    setSaving(true)
    setSaveError(null)
    try {
      const response = await updateOnboardingTask(activeTask.taskId, input)
      if (mountedRef.current) {
        setActiveTask(response)
        setEditingTask(false)
      }
    } catch (error) {
      if (mountedRef.current) {
        setSaveError(mapHrOnboardingErrorMessage(
          error,
          '온보딩 태스크 수정에 실패했습니다.',
        ))
      }
    } finally {
      savingTaskRef.current = false
      if (mountedRef.current) setSaving(false)
    }
  }

  async function handleActivation() {
    if (!activeTask || changingActivationRef.current || assigningRef.current) return
    changingActivationRef.current = true
    setChangingActivation(true)
    setActivationError(null)
    try {
      const response = await changeOnboardingTaskActivation(
        activeTask.taskId,
        !activeTask.active,
      )
      if (mountedRef.current) setActiveTask(response)
    } catch (error) {
      if (mountedRef.current) {
        setActivationError(mapHrOnboardingErrorMessage(
          error,
          '온보딩 태스크 활성 상태 변경에 실패했습니다.',
        ))
      }
    } finally {
      changingActivationRef.current = false
      if (mountedRef.current) setChangingActivation(false)
    }
  }

  function toggleEmployee(employeeId: number, checked: boolean) {
    setSelectedEmployeeIds((current) => {
      const next = new Set(current)
      if (checked) next.add(employeeId)
      else next.delete(employeeId)
      return next
    })
    setAssignError(null)
  }

  async function handleAssign() {
    if (
      !activeTask ||
      selectedEmployeeIds.size === 0 ||
      assigningRef.current ||
      changingActivationRef.current
    ) return
    assigningRef.current = true
    setAssigning(true)
    setAssignError(null)
    setAssignResult(null)
    try {
      const response = await assignOnboardingTask(
        activeTask.taskId,
        [...selectedEmployeeIds],
      )
      if (mountedRef.current) {
        setAssignResult(response)
        setSelectedEmployeeIds(new Set())
      }
    } catch (error) {
      if (mountedRef.current) {
        setAssignError(
          error instanceof AppError && error.status === 400
            ? ASSIGN_ELIGIBILITY_ERROR
            : mapHrOnboardingErrorMessage(
                error,
                '온보딩 배정에 실패했습니다.',
                '현재 상태에서는 온보딩을 배정할 수 없습니다.',
              ),
        )
      }
    } finally {
      assigningRef.current = false
      if (mountedRef.current) setAssigning(false)
    }
  }

  const departmentName = activeTask
    ? departments.find(
        (department) => department.departmentId === activeTask.departmentId,
      )?.departmentName ?? '부서 정보 없음'
    : ''

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>온보딩 관리</h1>
        <p className={styles.description}>
          신입사원 온보딩 태스크를 만들고 직원을 배정합니다.
        </p>
        <p className={styles.limitationNotice}>
          현재 시스템에서는 이 화면에서 새로 만든 온보딩 태스크만 이어서 관리할 수 있습니다.
        </p>
      </header>

      {organizationLoading && !organization && (
        <div className={styles.referenceLoading} role="status" aria-label="조직 정보를 불러오는 중">
          <Skeleton lines={2} />
        </div>
      )}
      {organizationError && (
        <div className={styles.referenceError}>
          <p className={styles.error} role="alert">{organizationError}</p>
          <Button size="sm" variant="secondary" onClick={() => void loadOrganization()}>
            조직 정보 다시 불러오기
          </Button>
        </div>
      )}

      {!activeTask ? (
        <section className={styles.section} aria-labelledby="create-task-title">
          <h2 className={styles.sectionTitle} id="create-task-title">새 온보딩 태스크 만들기</h2>
          <OnboardingTaskForm
            departments={departments}
            departmentsLoading={organizationLoading}
            submitting={creating}
            onSubmit={(input) => void handleCreate(input)}
            submitLabel="태스크 만들기"
          />
          {createError && <p className={styles.error} role="alert">{createError}</p>}
        </section>
      ) : (
        <>
          <section className={styles.section} aria-labelledby="active-task-title">
            {editingTask ? (
              <>
                <h2 className={styles.sectionTitle} id="active-task-title">온보딩 태스크 수정</h2>
                <OnboardingTaskForm
                  departments={departments}
                  departmentsLoading={organizationLoading}
                  initialValue={{
                    departmentId: activeTask.departmentId,
                    taskTitle: activeTask.taskTitle,
                    taskDescription: activeTask.taskDescription,
                    defaultDueDays: activeTask.defaultDueDays,
                  }}
                  submitting={saving}
                  onSubmit={(input) => void handleSave(input)}
                  onCancel={() => {
                    setEditingTask(false)
                    setSaveError(null)
                  }}
                  submitLabel="수정 저장"
                />
                {saveError && <p className={styles.error} role="alert">{saveError}</p>}
              </>
            ) : (
              <>
                <div className={styles.taskHeading}>
                  <h2 className={styles.sectionTitle} id="active-task-title">{activeTask.taskTitle}</h2>
                  <Badge variant={activeTask.active ? 'success' : 'neutral'}>
                    {activeTask.active ? '활성' : '비활성'}
                  </Badge>
                </div>
                <p className={styles.taskDescription}>{activeTask.taskDescription}</p>
                <dl className={styles.taskDetails}>
                  <div><dt>부서</dt><dd>{departmentName}</dd></div>
                  <div><dt>배정 후 완료 기한</dt><dd>{activeTask.defaultDueDays}일</dd></div>
                </dl>
                <div className={styles.actions}>
                  <Button
                    variant="secondary"
                    disabled={organizationLoading || !organization || changingActivation}
                    onClick={() => {
                      setSaveError(null)
                      setEditingTask(true)
                    }}
                  >
                    수정
                  </Button>
                  <Button
                    variant={activeTask.active ? 'danger' : 'primary'}
                    loading={changingActivation}
                    disabled={changingActivation || assigning}
                    onClick={() => void handleActivation()}
                  >
                    {activeTask.active ? '비활성화' : '활성화'}
                  </Button>
                </div>
                {activationError && <p className={styles.error} role="alert">{activationError}</p>}
              </>
            )}
          </section>

          <section className={styles.section} aria-labelledby="assignment-title">
            <h2 className={styles.sectionTitle} id="assignment-title">직원 배정</h2>
            {!activeTask.active ? (
              <p className={styles.notice}>비활성 온보딩 태스크에는 직원을 배정할 수 없습니다.</p>
            ) : organizationError ? (
              <p className={styles.notice}>조직 정보를 불러온 후 직원을 선택할 수 있습니다.</p>
            ) : organizationLoading ? (
              <p className={styles.notice} role="status">직원 정보를 불러오는 중입니다.</p>
            ) : (
              <>
                <p className={styles.notice}>신입사원만 배정할 수 있습니다.</p>
                {employees.length === 0 ? (
                  <p className={styles.notice}>선택 가능한 직원이 없습니다.</p>
                ) : (
                  <fieldset className={styles.employeeFieldset} disabled={assigning}>
                    <legend>배정할 직원 선택</legend>
                    <div className={styles.employeeList}>
                      {employees.map((employee) => (
                        <label className={styles.employeeOption} key={employee.employeeId}>
                          <input
                            type="checkbox"
                            checked={selectedEmployeeIds.has(employee.employeeId)}
                            onChange={(event) => toggleEmployee(
                              employee.employeeId,
                              event.target.checked,
                            )}
                          />
                          <span>
                            {employee.employeeName} · {employee.departmentName}
                            {employee.jobGradeName ? ` · ${employee.jobGradeName}` : ''}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
                <Button
                  loading={assigning}
                  disabled={assigning || selectedEmployeeIds.size === 0 || changingActivation}
                  onClick={() => void handleAssign()}
                >
                  선택한 직원 배정
                </Button>
                {assignError && <p className={styles.error} role="alert">{assignError}</p>}
                {assignResult && (
                  <p className={styles.success} role="status">
                    배정 요청 {assignResult.requestedCount}명 중 성공 {assignResult.successCount}명,
                    중복 제외 {assignResult.duplicateCount}명
                  </p>
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  )
}
