import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, EmptyState, Skeleton } from '../../shared/ui'
import { CourseForm } from './CourseForm'
import { CourseAssignmentSection } from './CourseAssignmentSection'
import {
  changeCoursePublication,
  changeModuleActivation,
  createHrCourseModule,
  deleteHrCourse,
  fetchHrCourse,
  fetchHrCourseModules,
  updateHrCourse,
  updateHrCourseModule,
} from './hrCourseApi'
import {
  coursePublicationBadgeVariant,
  coursePublicationLabel,
  getAllowedPublicationTargets,
  mapHrCourseErrorMessage,
} from './hrCourseHelpers'
import type {
  CoursePublicationStatus,
  HrCourse,
  HrCourseFormInput,
  HrCourseModule,
  HrCourseModuleFormInput,
} from './hrCourseTypes'
import { ModuleForm } from './ModuleForm'
import styles from './HrCourseDetailPage.module.css'

const COURSE_ERROR = '교육 과정 정보를 불러오지 못했습니다.'
const MODULE_ERROR = '학습 모듈을 불러오지 못했습니다.'
const MODULE_CONFLICT = '이미 사용 중인 학습 순서이거나 현재 상태에서 변경할 수 없습니다.'
const dateFormatter = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeZone: 'UTC' })
function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? '날짜 정보 없음' : dateFormatter.format(date)
}
function publicationActionLabel(status: CoursePublicationStatus) {
  if (status === 'PUBLIC') return '공개'
  if (status === 'PRIVATE') return '비공개로 전환'
  return '초안으로 되돌리기'
}

export function HrCourseDetailPage() {
  const { courseId: courseIdParam } = useParams()
  const courseId = Number(courseIdParam)
  const validCourseId = Number.isInteger(courseId) && courseId > 0
  const navigate = useNavigate()
  const [course, setCourse] = useState<HrCourse | null>(null)
  const [courseLoading, setCourseLoading] = useState(validCourseId)
  const [courseError, setCourseError] = useState<string | null>(null)
  const [editingCourse, setEditingCourse] = useState(false)
  const [savingCourse, setSavingCourse] = useState(false)
  const [changingPublication, setChangingPublication] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [modules, setModules] = useState<HrCourseModule[]>([])
  const [modulesLoading, setModulesLoading] = useState(validCourseId)
  const [modulesError, setModulesError] = useState<string | null>(null)
  const [showCreateModule, setShowCreateModule] = useState(false)
  const [creatingModule, setCreatingModule] = useState(false)
  const [createModuleError, setCreateModuleError] = useState<string | null>(null)
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null)
  const [pendingModuleIds, setPendingModuleIds] = useState<Set<number>>(new Set())
  const [actionErrorByModuleId, setActionErrorByModuleId] = useState<Map<number, string>>(new Map())
  const courseFetchIdRef = useRef(0)
  const moduleFetchIdRef = useRef(0)
  const mountedRef = useRef(false)
  const savingCourseRef = useRef(false)
  const changingPublicationRef = useRef(false)
  const deletingRef = useRef(false)
  const creatingModuleRef = useRef(false)
  const pendingModuleIdsRef = useRef<Set<number>>(new Set())

  const loadCourse = useCallback(async () => {
    if (!validCourseId) return
    const requestId = ++courseFetchIdRef.current
    setCourseLoading(true); setCourseError(null)
    try {
      const response = await fetchHrCourse(courseId)
      if (!mountedRef.current || requestId !== courseFetchIdRef.current) return
      setCourse(response)
    } catch (error) {
      if (!mountedRef.current || requestId !== courseFetchIdRef.current) return
      setCourseError(mapHrCourseErrorMessage(error, COURSE_ERROR))
    } finally {
      if (mountedRef.current && requestId === courseFetchIdRef.current) setCourseLoading(false)
    }
  }, [courseId, validCourseId])

  const loadModules = useCallback(async () => {
    if (!validCourseId) return
    const requestId = ++moduleFetchIdRef.current
    setModulesLoading(true); setModulesError(null)
    try {
      const response = await fetchHrCourseModules(courseId)
      if (!mountedRef.current || requestId !== moduleFetchIdRef.current) return
      setModules(response)
    } catch (error) {
      if (!mountedRef.current || requestId !== moduleFetchIdRef.current) return
      setModulesError(mapHrCourseErrorMessage(error, MODULE_ERROR))
    } finally {
      if (mountedRef.current && requestId === moduleFetchIdRef.current) setModulesLoading(false)
    }
  }, [courseId, validCourseId])

  useEffect(() => {
    const pendingIds = pendingModuleIdsRef.current
    mountedRef.current = true
    if (validCourseId) queueMicrotask(() => { void loadCourse(); void loadModules() })
    return () => {
      mountedRef.current = false; courseFetchIdRef.current += 1; moduleFetchIdRef.current += 1
      pendingIds.clear()
    }
  }, [loadCourse, loadModules, validCourseId])

  async function handleCourseSave(input: HrCourseFormInput) {
    if (savingCourseRef.current) return
    savingCourseRef.current = true; setSavingCourse(true); setCourseError(null)
    let succeeded = false
    try { await updateHrCourse(courseId, input); succeeded = true }
    catch (error) { if (mountedRef.current) setCourseError(mapHrCourseErrorMessage(error, '교육 과정 수정에 실패했습니다.')) }
    if (succeeded && mountedRef.current) { setEditingCourse(false); await loadCourse() }
    savingCourseRef.current = false
    if (mountedRef.current) setSavingCourse(false)
  }

  async function handlePublication(target: CoursePublicationStatus) {
    if (changingPublicationRef.current) return
    changingPublicationRef.current = true; setChangingPublication(true); setCourseError(null)
    let succeeded = false
    try { await changeCoursePublication(courseId, target); succeeded = true }
    catch (error) { if (mountedRef.current) setCourseError(mapHrCourseErrorMessage(error, '공개 상태 변경에 실패했습니다.')) }
    if (succeeded && mountedRef.current) await loadCourse()
    changingPublicationRef.current = false
    if (mountedRef.current) setChangingPublication(false)
  }

  async function handleDelete() {
    if (deletingRef.current) return
    if (!window.confirm('이 교육 과정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    deletingRef.current = true; setDeleting(true); setCourseError(null)
    try { await deleteHrCourse(courseId); navigate('/hr/courses', { replace: true }) }
    catch (error) { if (mountedRef.current) setCourseError(mapHrCourseErrorMessage(error, '교육 과정 삭제에 실패했습니다.')) }
    finally { deletingRef.current = false; if (mountedRef.current) setDeleting(false) }
  }

  function beginModuleWrite(moduleId: number) {
    if (pendingModuleIdsRef.current.has(moduleId)) return false
    pendingModuleIdsRef.current.add(moduleId)
    setPendingModuleIds(new Set(pendingModuleIdsRef.current))
    setActionErrorByModuleId((current) => { const next = new Map(current); next.delete(moduleId); return next })
    return true
  }
  function finishModuleWrite(moduleId: number) {
    pendingModuleIdsRef.current.delete(moduleId)
    if (mountedRef.current) setPendingModuleIds(new Set(pendingModuleIdsRef.current))
  }

  async function handleModuleUpdate(moduleId: number, input: HrCourseModuleFormInput) {
    if (!beginModuleWrite(moduleId)) return
    let succeeded = false
    try { await updateHrCourseModule(moduleId, input); succeeded = true }
    catch (error) { if (mountedRef.current) setActionErrorByModuleId((current) => new Map(current).set(moduleId, mapHrCourseErrorMessage(error, '학습 모듈 수정에 실패했습니다.', MODULE_CONFLICT))) }
    if (succeeded && mountedRef.current) { setEditingModuleId(null); await loadModules() }
    finishModuleWrite(moduleId)
  }

  async function handleModuleActivation(module: HrCourseModule) {
    const moduleId = module.courseModuleId
    if (!beginModuleWrite(moduleId)) return
    let succeeded = false
    try { await changeModuleActivation(moduleId, !module.active); succeeded = true }
    catch (error) { if (mountedRef.current) setActionErrorByModuleId((current) => new Map(current).set(moduleId, mapHrCourseErrorMessage(error, '학습 모듈 상태 변경에 실패했습니다.', MODULE_CONFLICT))) }
    if (succeeded && mountedRef.current) await loadModules()
    finishModuleWrite(moduleId)
  }

  async function handleModuleCreate(input: HrCourseModuleFormInput) {
    if (creatingModuleRef.current) return
    creatingModuleRef.current = true; setCreatingModule(true); setCreateModuleError(null)
    let succeeded = false
    try { await createHrCourseModule(courseId, input); succeeded = true }
    catch (error) { if (mountedRef.current) setCreateModuleError(mapHrCourseErrorMessage(error, '학습 모듈 생성에 실패했습니다.', MODULE_CONFLICT)) }
    if (succeeded && mountedRef.current) { setShowCreateModule(false); await loadModules() }
    creatingModuleRef.current = false
    if (mountedRef.current) setCreatingModule(false)
  }

  if (!validCourseId) return <div className={styles.page}><p className={styles.error} role="alert">잘못된 교육 과정 정보입니다.</p><Link className={styles.backLink} to="/hr/courses"><ArrowLeft size={16} aria-hidden="true" />교육 과정 목록으로 돌아가기</Link></div>

  return <div className={styles.page}>
    <Link className={styles.backLink} to="/hr/courses"><ArrowLeft size={16} aria-hidden="true" />교육 과정 목록으로 돌아가기</Link>
    <section className={styles.section} aria-labelledby="course-title">
      {courseLoading && !course ? <div role="status" aria-label="교육 과정 정보를 불러오는 중"><Skeleton lines={5}/></div> : course ? <>
        <header className={styles.pageHeader}><div className={styles.titleArea}><h1 className={styles.title} id="course-title">{course.courseName}</h1><div className={styles.badgeGroup}><Badge variant={coursePublicationBadgeVariant(course.publicationStatus)}>{coursePublicationLabel(course.publicationStatus)}</Badge><Badge variant={course.required ? 'warning' : 'neutral'}>{course.required ? '필수' : '선택'}</Badge></div></div></header>
        {courseError && <p className={styles.error} role="alert">{courseError}</p>}
        <section className={styles.summaryCard} aria-labelledby="summary-title"><div className={styles.panelHeader}><div><h2 className={styles.sectionTitle} id="summary-title">기본 정보</h2><p>과정의 주요 정보와 교육 기간입니다.</p></div>{!editingCourse && <Button variant="secondary" onClick={() => setEditingCourse(true)}>수정</Button>}</div>
          {editingCourse ? <CourseForm initialValue={{ courseName: course.courseName, courseDescription: course.courseDescription, required: course.required, trainingStartDate: course.trainingStartDate, trainingEndDate: course.trainingEndDate }} submitting={savingCourse} submitLabel="수정 저장" onSubmit={(input) => void handleCourseSave(input)} onCancel={() => setEditingCourse(false)} /> : <div className={styles.summaryContent}><dl className={styles.summaryGrid}><div><dt>과정명</dt><dd>{course.courseName}</dd></div><div><dt>교육 기간</dt><dd>{formatDate(course.trainingStartDate)} ~ {formatDate(course.trainingEndDate)}</dd></div></dl><div className={styles.descriptionBlock}><span>과정 설명</span><p className={styles.description}>{course.courseDescription}</p></div></div>}
        </section>
        <section className={styles.publication} aria-labelledby="publication-title"><div className={styles.panelHeader}><div><h2 className={styles.sectionTitle} id="publication-title">공개 상태</h2><p>직원에게 노출되는 과정 상태를 관리합니다.</p></div><Badge variant={coursePublicationBadgeVariant(course.publicationStatus)}>{coursePublicationLabel(course.publicationStatus)}</Badge></div><div className={styles.actions}>{getAllowedPublicationTargets(course.publicationStatus).map((target) => <Button key={target} variant="secondary" loading={changingPublication} disabled={changingPublication || deleting} onClick={() => void handlePublication(target)}>{publicationActionLabel(target)}</Button>)}</div></section>
        <section className={styles.dangerZone} aria-labelledby="danger-title"><div><h2 id="danger-title">위험 영역</h2><p>이 과정과 관련된 설정을 삭제합니다. 삭제한 과정은 되돌릴 수 없습니다.</p></div><Button variant="danger" loading={deleting} disabled={deleting || changingPublication} onClick={() => void handleDelete()}>교육 과정 삭제</Button></section>
      </> : courseError ? <div className={styles.errorState}><p className={styles.error} role="alert">{courseError}</p><Button variant="secondary" onClick={() => void loadCourse()}>다시 시도</Button></div> : null}
    </section>

    <section className={styles.section} aria-labelledby="modules-title">
      <div className={styles.sectionHeader}><div className={styles.sectionTitleGroup}><h2 className={styles.sectionTitle} id="modules-title">학습 모듈</h2><p>과정에서 학습할 콘텐츠와 순서를 관리합니다.</p></div><Button leadingIcon={<Plus size={16} aria-hidden="true" />} disabled={showCreateModule} onClick={() => { setEditingModuleId(null); setShowCreateModule(true); setCreateModuleError(null) }}>모듈 추가</Button></div>
      {showCreateModule && <div className={styles.formPanel}>{createModuleError && <p className={styles.error} role="alert">{createModuleError}</p>}<ModuleForm submitting={creatingModule} submitLabel="모듈 만들기" onSubmit={(input) => void handleModuleCreate(input)} onCancel={() => setShowCreateModule(false)} /></div>}
      {modulesError && <div className={styles.errorState}><p className={styles.error} role="alert">{modulesError}</p><Button variant="secondary" onClick={() => void loadModules()}>다시 시도</Button></div>}
      {modulesLoading && modules.length === 0 ? <div className={styles.skeletons} role="status" aria-label="학습 모듈을 불러오는 중"><Skeleton lines={4}/><Skeleton lines={4}/></div>
        : modules.length === 0 ? <EmptyState title="학습 모듈이 없습니다." description="모듈을 추가해 교육 내용을 구성하세요."/>
        : <ol className={styles.moduleList}>{modules.map((module) => {
          const pending = pendingModuleIds.has(module.courseModuleId)
          const actionError = actionErrorByModuleId.get(module.courseModuleId)
          return <li className={styles.moduleItem} key={module.courseModuleId}>
            <div className={styles.moduleHeader}><h3 className={styles.moduleTitle}>{module.moduleTitle}</h3><div className={styles.badgeGroup}><Badge variant={module.required ? 'warning' : 'neutral'}>{module.required ? '필수' : '선택'}</Badge><Badge variant={module.active ? 'success' : 'neutral'}>{module.active ? '활성' : '비활성'}</Badge></div></div>
            {editingModuleId === module.courseModuleId ? <ModuleForm initialValue={{ moduleTitle: module.moduleTitle, moduleContent: module.moduleContent ?? '', referenceUrl: module.referenceUrl ?? '', moduleOrder: module.moduleOrder, required: module.required }} submitting={pending} submitLabel="수정 저장" onSubmit={(input) => void handleModuleUpdate(module.courseModuleId, input)} onCancel={() => setEditingModuleId(null)} /> : <>
              <div className={styles.moduleBody}><p className={styles.order}>학습 순서 {module.moduleOrder}</p>{module.moduleContent?.trim() && <p className={styles.moduleContent}>{module.moduleContent}</p>}{module.referenceUrl && <a href={module.referenceUrl} target="_blank" rel="noreferrer">참고 자료 열기</a>}</div>
              <div className={styles.moduleActions}><Button size="sm" variant="secondary" disabled={pending} onClick={() => { setShowCreateModule(false); setEditingModuleId(module.courseModuleId) }}>수정</Button><Button size="sm" variant="secondary" loading={pending} disabled={pending} onClick={() => void handleModuleActivation(module)}>{module.active ? '비활성화' : '활성화'}</Button></div>
            </>}
            {actionError && <p className={styles.error} role="alert">{actionError}</p>}
          </li>
        })}</ol>}
    </section>
    {course && <CourseAssignmentSection course={course} />}
  </div>
}
