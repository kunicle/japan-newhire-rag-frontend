import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CourseForm } from './CourseForm'
import { createHrCourse } from './hrCourseApi'
import { mapHrCourseErrorMessage } from './hrCourseHelpers'
import type { HrCourseFormInput } from './hrCourseTypes'
import styles from './HrCourseCreatePage.module.css'

export function HrCourseCreatePage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submittingRef = useRef(false)

  async function handleSubmit(input: HrCourseFormInput) {
    if (submittingRef.current) return
    submittingRef.current = true; setSubmitting(true); setError(null)
    try {
      const course = await createHrCourse(input)
      navigate(`/hr/courses/${course.courseId}`, { replace: true })
    } catch (submitError) {
      setError(mapHrCourseErrorMessage(submitError, '교육 과정 생성에 실패했습니다.'))
    } finally {
      submittingRef.current = false; setSubmitting(false)
    }
  }

  return <div className={styles.page}>
    <Link className={styles.backLink} to="/hr/courses">교육 과정 목록으로 돌아가기</Link>
    <h1 className={styles.title}>새 교육 과정</h1>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <CourseForm submitting={submitting} submitLabel="과정 만들기" onSubmit={(input) => void handleSubmit(input)} />
  </div>
}
