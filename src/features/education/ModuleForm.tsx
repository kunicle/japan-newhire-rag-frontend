import { useState, type FormEvent } from 'react'
import { Button, Input } from '../../shared/ui'
import type { HrCourseModuleFormInput } from './hrCourseTypes'
import styles from './ModuleForm.module.css'

interface ModuleFormProps {
  initialValue?: HrCourseModuleFormInput
  submitting: boolean
  onSubmit: (input: HrCourseModuleFormInput) => void
  onCancel?: () => void
  submitLabel: string
}

const EMPTY_VALUE: HrCourseModuleFormInput = {
  moduleTitle: '', moduleContent: '', referenceUrl: '', moduleOrder: 1, required: false,
}

export function ModuleForm({
  initialValue,
  submitting,
  onSubmit,
  onCancel,
  submitLabel,
}: ModuleFormProps) {
  const [value, setValue] = useState<HrCourseModuleFormInput>(initialValue ?? EMPTY_VALUE)
  const [validationError, setValidationError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const moduleContent = value.moduleContent.trim()
    const referenceUrl = value.referenceUrl.trim()
    if (!moduleContent && !referenceUrl) {
      setValidationError('학습 내용 또는 참고 링크 중 하나는 입력해야 합니다.')
      return
    }
    setValidationError(null)
    onSubmit({ ...value, moduleContent, referenceUrl })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input label="모듈명" required value={value.moduleTitle} disabled={submitting}
        onChange={(event) => setValue({ ...value, moduleTitle: event.target.value })} />
      <div className={styles.field}>
        <label htmlFor="module-content">학습 내용</label>
        <textarea id="module-content" value={value.moduleContent} disabled={submitting}
          onChange={(event) => setValue({ ...value, moduleContent: event.target.value })} />
      </div>
      <Input label="참고 링크" type="url" value={value.referenceUrl} disabled={submitting}
        onChange={(event) => setValue({ ...value, referenceUrl: event.target.value })} />
      <Input label="학습 순서" type="number" min={1} required value={value.moduleOrder}
        disabled={submitting}
        onChange={(event) => setValue({ ...value, moduleOrder: Number(event.target.value) })} />
      <label className={styles.checkboxRow}>
        <input type="checkbox" checked={value.required} disabled={submitting}
          onChange={(event) => setValue({ ...value, required: event.target.checked })} />
        <span>필수 모듈</span>
      </label>
      {validationError && <p className={styles.error} role="alert">{validationError}</p>}
      <div className={styles.actions}>
        {onCancel && <Button variant="secondary" disabled={submitting} onClick={onCancel}>취소</Button>}
        <Button type="submit" loading={submitting} disabled={submitting}>{submitLabel}</Button>
      </div>
    </form>
  )
}
