import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cx } from '../lib/cx'
import styles from './Input.module.css'

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  label: string
  hideLabel?: boolean
  helperText?: string
  errorMessage?: string
  required?: boolean
  size?: 'sm' | 'md'
  prefix?: ReactNode
  suffix?: ReactNode
}

export function Input({
  label,
  hideLabel = false,
  helperText,
  errorMessage,
  required = false,
  size = 'md',
  prefix,
  suffix,
  id,
  className,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...inputProps
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const feedbackId = errorMessage
    ? `${inputId}-error`
    : helperText
      ? `${inputId}-helper`
      : undefined
  const describedBy = [ariaDescribedBy, feedbackId].filter(Boolean).join(' ')

  return (
    <div className={cx(styles.field, className)}>
      <label className={hideLabel ? 'sr-only' : styles.label} htmlFor={inputId}>
        {label}
        {required && (
          <>
            <span className="sr-only"> (필수)</span>
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          </>
        )}
      </label>
      <div className={cx(styles.control, styles[size], errorMessage && styles.error)}>
        {prefix && <span className={styles.adornment}>{prefix}</span>}
        <input
          {...inputProps}
          id={inputId}
          className={styles.input}
          required={required}
          aria-invalid={errorMessage ? true : ariaInvalid}
          aria-describedby={describedBy || undefined}
        />
        {suffix && <span className={styles.adornment}>{suffix}</span>}
      </div>
      {errorMessage ? (
        <p id={feedbackId} className={styles.errorMessage}>
          {errorMessage}
        </p>
      ) : (
        helperText && (
          <p id={feedbackId} className={styles.helperText}>
            {helperText}
          </p>
        )
      )}
    </div>
  )
}
