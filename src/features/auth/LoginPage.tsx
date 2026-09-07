import { Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button, Input } from '../../shared/ui'
import { useAuth } from './AuthContext'
import { mapLoginErrorMessage } from './authErrors'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setErrorText(null)

    try {
      await login(email, password)
    } catch (error) {
      setErrorText(mapLoginErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const PasswordIcon = showPassword ? EyeOff : Eye

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">S</span>
            <span>주식회사 SLDK</span>
          </div>
          <h1 className={styles.title}>로그인</h1>
          <p className={styles.description}>
            사내 문서, 교육, 평가와 온보딩 업무를 한 곳에서 관리하세요.
          </p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="이메일"
            type="text"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            label="비밀번호"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            suffix={
              <button
                className={styles.passwordToggle}
                type="button"
                aria-label={
                  showPassword ? '비밀번호 숨기기' : '비밀번호 표시'
                }
                onClick={() => setShowPassword((visible) => !visible)}
              >
                <PasswordIcon size={18} aria-hidden="true" />
              </button>
            }
          />
          {errorText && (
            <p role="alert" className={styles.formError}>
              {errorText}
            </p>
          )}
          <Button type="submit" fullWidth loading={submitting}>
            로그인
          </Button>
        </form>
      </div>
    </main>
  )
}
