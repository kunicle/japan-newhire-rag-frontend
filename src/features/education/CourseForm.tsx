import { useState, type FormEvent } from 'react'
import { Button, Input } from '../../shared/ui'
import type { HrCourseFormInput } from './hrCourseTypes'
import styles from './CourseForm.module.css'

interface CourseFormProps {
  initialValue?: HrCourseFormInput
  submitting: boolean
  onSubmit: (input: HrCourseFormInput) => void
  onCancel?: () => void
  submitLabel: string
}

const EMPTY_VALUE: HrCourseFormInput = {
  courseName: '', courseDescription: '', required: false,
  trainingStartDate: '', trainingEndDate: '',
}

export function CourseForm({
  initialValue,
  submitting,
  onSubmit,
  onCancel,
  submitLabel,
}: CourseFormProps) {
  const [value, setValue] = useState<HrCourseFormInput>(initialValue ?? EMPTY_VALUE)
  const [validationError, setValidationError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (value.trainingEndDate < value.trainingStartDate) {
      setValidationError('종료일은 시작일보다 빠를 수 없습니다.')
      return
    }
    setValidationError(null)
    onSubmit(value)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input label="과정명" required maxLength={100} value={value.courseName}
        disabled={submitting}
        onChange={(event) => setValue({ ...value, courseName: event.target.value })} />
      <div className={styles.field}>
        <label htmlFor="course-description">과정 설명</label>
        <textarea id="course-description" required maxLength={2000}
          value={value.courseDescription} disabled={submitting}
          onChange={(event) => setValue({ ...value, courseDescription: event.target.value })} />
      </div>
      <label className={styles.checkboxRow}>
        <input type="checkbox" checked={value.required} disabled={submitting}
          onChange={(event) => setValue({ ...value, required: event.target.checked })} />
        <span>필수 과정</span>
      </label>
      <div className={styles.dateGrid}>
        <Input label="시작일" type="date" required value={value.trainingStartDate}
          disabled={submitting}
          onChange={(event) => setValue({ ...value, trainingStartDate: event.target.value })} />
        <Input label="종료일" type="date" required value={value.trainingEndDate}
          disabled={submitting}
          onChange={(event) => setValue({ ...value, trainingEndDate: event.target.value })} />
      </div>
      {validationError && <p className={styles.error} role="alert">{validationError}</p>}
      <div className={styles.actions}>
        {onCancel && <Button variant="secondary" disabled={submitting} onClick={onCancel}>취소</Button>}
        <Button type="submit" loading={submitting} disabled={submitting}>{submitLabel}</Button>
      </div>
    </form>
  )
}
