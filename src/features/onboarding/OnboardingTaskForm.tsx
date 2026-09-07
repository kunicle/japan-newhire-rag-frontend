import { useState, type FormEvent } from 'react'
import type { FlatDepartment } from '../organization/organizationHelpers'
import { Button, Input } from '../../shared/ui'
import type { OnboardingTaskFormInput } from './hrOnboardingTypes'
import styles from './OnboardingTaskForm.module.css'

interface OnboardingTaskFormProps {
  departments: FlatDepartment[]
  departmentsLoading: boolean
  initialValue?: OnboardingTaskFormInput
  submitting: boolean
  onSubmit: (input: OnboardingTaskFormInput) => void
  onCancel?: () => void
  submitLabel: string
}

const EMPTY_VALUE: OnboardingTaskFormInput = {
  departmentId: null,
  taskTitle: '',
  taskDescription: '',
  defaultDueDays: 1,
}

export function OnboardingTaskForm({
  departments,
  departmentsLoading,
  initialValue,
  submitting,
  onSubmit,
  onCancel,
  submitLabel,
}: OnboardingTaskFormProps) {
  const [value, setValue] = useState<OnboardingTaskFormInput>(
    initialValue ?? EMPTY_VALUE,
  )
  const [validationError, setValidationError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (value.departmentId === null) {
      setValidationError('부서를 선택해 주세요.')
      return
    }
    if (!Number.isFinite(value.defaultDueDays) || value.defaultDueDays < 1) {
      setValidationError('1일 이상의 완료 기한을 입력해 주세요.')
      return
    }
    setValidationError(null)
    onSubmit(value)
  }

  const referenceUnavailable = departmentsLoading || departments.length === 0

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="onboarding-department">부서</label>
        <select
          id="onboarding-department"
          required
          value={value.departmentId ?? ''}
          disabled={submitting || referenceUnavailable}
          onChange={(event) => setValue({
            ...value,
            departmentId: event.target.value ? Number(event.target.value) : null,
          })}
        >
          <option value="">
            {departmentsLoading
              ? '부서를 불러오는 중입니다.'
              : departments.length === 0
                ? '선택 가능한 부서가 없습니다.'
                : '부서를 선택해 주세요.'}
          </option>
          {departments.map((department) => (
            <option key={department.departmentId} value={department.departmentId}>
              {department.departmentName}
            </option>
          ))}
        </select>
      </div>
      <Input
        label="태스크 제목"
        required
        maxLength={200}
        value={value.taskTitle}
        disabled={submitting}
        onChange={(event) => setValue({ ...value, taskTitle: event.target.value })}
      />
      <div className={styles.field}>
        <label htmlFor="onboarding-task-description">태스크 설명</label>
        <textarea
          id="onboarding-task-description"
          required
          maxLength={2000}
          value={value.taskDescription}
          disabled={submitting}
          onChange={(event) => setValue({ ...value, taskDescription: event.target.value })}
        />
      </div>
      <Input
        label="배정 후 완료 기한(일)"
        type="number"
        required
        min={1}
        value={value.defaultDueDays}
        disabled={submitting}
        onChange={(event) => setValue({
          ...value,
          defaultDueDays: Number(event.target.value),
        })}
      />
      {validationError && <p className={styles.error} role="alert">{validationError}</p>}
      <div className={styles.actions}>
        {onCancel && (
          <Button variant="secondary" disabled={submitting} onClick={onCancel}>취소</Button>
        )}
        <Button
          type="submit"
          loading={submitting}
          disabled={submitting || referenceUnavailable}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
