import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppError } from '../../shared/api/errors'
import { Badge, Button, Skeleton } from '../../shared/ui'
import { fetchOrganization } from '../organization/organizationApi'
import { flattenEmployees, type FlatEmployee } from '../organization/organizationHelpers'
import { evaluationCycleStatusBadgeVariant, evaluationCycleStatusLabel } from './evaluationHelpers'
import {
  createEvaluationItem, createEvaluationTemplate, fetchEvaluationCycle, fetchEvaluationProgress,
  fetchEvaluationItems, fetchEvaluationTemplates, updateEvaluationCycle,
  updateEvaluationItem, updateEvaluationTemplate,
} from './hrEvaluationApi'
import { isAssignmentWritable, isCycleDatesEditable, isCycleEditable, isTemplateOrItemWritable, mapHrEvaluationErrorMessage } from './hrEvaluationHelpers'
import type { EvaluationCycle, EvaluationItem, EvaluationItemCreateInput, EvaluationItemUpdateInput, EvaluationProgress, EvaluationTemplate, EvaluationType } from './hrEvaluationTypes'
import { HrEvaluationAssignmentSection } from './HrEvaluationAssignmentSection'
import { HrEvaluationProgressSection } from './HrEvaluationProgressSection'
import { HrEvaluationPublishPanel } from './HrEvaluationPublishPanel'
import styles from './HrEvaluationCycleDetailPage.module.css'

interface ItemsState { loading: boolean; data: EvaluationItem[] | null; error: string | null; warning: string | null }
interface ItemForm { itemName: string; itemDescription: string; itemOrder: string; weight: string; isRequired: boolean }
const EMPTY_ITEM: ItemForm = { itemName: '', itemDescription: '', itemOrder: '1', weight: '1', isRequired: true }
const TEMPLATE_META: Array<{ type: EvaluationType; title: string }> = [
  { type: 'SELF', title: '자기 평가 템플릿' }, { type: 'MANAGER', title: '관리자 평가 템플릿' },
]

function conflictMessage(error: unknown, kind: 'template-create' | 'template-update' | 'item-create' | 'item-update'): string {
  if (error instanceof AppError) {
    if (error.code === 'EVALUATION_TEMPLATE_DUPLICATE_TYPE') return '이미 해당 평가 유형의 템플릿이 있습니다.'
    if (error.code === 'EVALUATION_TEMPLATE_NOT_EDITABLE') return '이미 평가에 사용된 템플릿은 수정할 수 없습니다.'
    if (error.code === 'EVALUATION_ITEM_DUPLICATE_ORDER') return '같은 순서의 평가 항목이 이미 있습니다.'
    if (error.code === 'EVALUATION_ITEM_NOT_EDITABLE') return '이미 평가에 사용된 항목은 수정할 수 없습니다.'
  }
  if (kind === 'template-create') return '이미 해당 평가 유형의 템플릿이 있습니다.'
  if (kind === 'template-update') return '이미 평가에 사용된 템플릿은 수정할 수 없습니다.'
  if (kind === 'item-create') return '같은 순서의 평가 항목이 이미 있습니다.'
  return '이미 평가에 사용된 항목은 수정할 수 없습니다.'
}

function itemInput(form: ItemForm): EvaluationItemUpdateInput | null {
  const order = Number(form.itemOrder)
  const weight = Number(form.weight)
  const normalizedWeight = form.weight.trim()
  const weightPattern = /^\d+(?:\.\d{1,2})?$/
  const integerDigits = (normalizedWeight.split('.')[0] ?? '').replace(/^0+/, '').length
  if (!form.itemName.trim() || form.itemName.length > 100 || form.itemDescription.length > 1000
    || form.itemOrder.trim() === '' || !Number.isInteger(order) || !weightPattern.test(normalizedWeight)
    || weight <= 0 || integerDigits > 5) return null
  return { itemName: form.itemName, itemDescription: form.itemDescription === '' ? null : form.itemDescription, itemOrder: order, weight, isRequired: form.isRequired, minimumScore: 1, maximumScore: 5 }
}

function toItemForm(item: EvaluationItem): ItemForm {
  return { itemName: item.itemName, itemDescription: item.itemDescription ?? '', itemOrder: String(item.itemOrder), weight: String(item.weight), isRequired: item.isRequired }
}

function ItemEditor({ item, disabled, onSave }: { item: EvaluationItem; disabled: boolean; onSave: (item: EvaluationItem, form: ItemForm) => Promise<void> }) {
  const [form, setForm] = useState(() => toItemForm(item))
  const [error, setError] = useState<string | null>(null)
  return (
    <li className={styles.itemCard}>
      <div className={styles.itemHeading}><h5>{item.itemOrder}. {item.itemName}</h5>{item.isRequired && <Badge variant="warning">필수</Badge>}</div>
      {disabled ? (
        <><p>{item.itemDescription ?? '설명이 없습니다.'}</p><p className={styles.meta}>가중치 {item.weight} · 점수 {item.minimumScore ?? '미설정'}~{item.maximumScore ?? '미설정'}</p></>
      ) : (
        <div className={styles.formGrid}>
          <Field label="항목명" id={`item-name-${item.evaluationItemId}`}><input id={`item-name-${item.evaluationItemId}`} maxLength={100} value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} /></Field>
          <Field label="순서" id={`item-order-${item.evaluationItemId}`}><input id={`item-order-${item.evaluationItemId}`} type="number" step="1" value={form.itemOrder} onChange={(e) => setForm({ ...form, itemOrder: e.target.value })} /></Field>
          <Field label="가중치" id={`item-weight-${item.evaluationItemId}`}><input id={`item-weight-${item.evaluationItemId}`} inputMode="decimal" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} /></Field>
          <Field label="설명" id={`item-description-${item.evaluationItemId}`} wide><textarea id={`item-description-${item.evaluationItemId}`} maxLength={1000} value={form.itemDescription} onChange={(e) => setForm({ ...form, itemDescription: e.target.value })} /></Field>
          <label className={styles.checkbox}><input type="checkbox" checked={form.isRequired} onChange={(e) => setForm({ ...form, isRequired: e.target.checked })} />필수 항목</label>
          <p className={styles.meta}>점수 범위 1~5</p>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={styles.actions}><Button size="sm" loading={disabled} onClick={() => { if (!itemInput(form)) { setError('항목 이름, 순서와 가중치를 확인해 주세요.'); return } setError(null); void onSave(item, form) }}>항목 수정</Button></div>
        </div>
      )}
    </li>
  )
}

function Field({ label, id, wide, children }: { label: string; id: string; wide?: boolean; children: React.ReactNode }) {
  return <div className={`${styles.field} ${wide ? styles.wide : ''}`}><label htmlFor={id}>{label}</label>{children}</div>
}

function HrEvaluationCycleDetailContent({ cycleId }: { cycleId: number }) {
  const [cycle, setCycle] = useState<EvaluationCycle | null>(null)
  const [cycleLoading, setCycleLoading] = useState(true)
  const [cycleError, setCycleError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [templatesError, setTemplatesError] = useState<string | null>(null)
  const [itemsByTemplate, setItemsByTemplate] = useState<Map<number, ItemsState>>(new Map())
  const [cycleName, setCycleName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [publishDate, setPublishDate] = useState('')
  const [cycleSaveError, setCycleSaveError] = useState<string | null>(null)
  const [cycleSaveSuccess, setCycleSaveSuccess] = useState<string | null>(null)
  const [cycleSaving, setCycleSaving] = useState(false)
  const [employees, setEmployees] = useState<FlatEmployee[]>([])
  const [organizationLoading, setOrganizationLoading] = useState(true)
  const [organizationError, setOrganizationError] = useState<string | null>(null)
  const [progress, setProgress] = useState<EvaluationProgress | null>(null)
  const [progressLoading, setProgressLoading] = useState(true)
  const [progressError, setProgressError] = useState<string | null>(null)
  const [activePublish, setActivePublish] = useState<{ evaluationId: number; employeeName: string } | null>(null)
  const [locallyPublishedEvaluationIds, setLocallyPublishedEvaluationIds] = useState<Set<number>>(new Set())
  const mountedRef = useRef(false)
  const latestCycleFetchIdRef = useRef(0)
  const latestTemplatesFetchIdRef = useRef(0)
  const latestOrganizationFetchIdRef = useRef(0)
  const latestProgressFetchIdRef = useRef(0)
  const itemsRequestIdsRef = useRef<Map<number, number>>(new Map())
  const cycleSaveRef = useRef(false)
  const templateWriteRefs = useRef<Map<EvaluationType, boolean>>(new Map())
  const itemCreateRefs = useRef<Map<number, boolean>>(new Map())
  const itemUpdateRefs = useRef<Set<number>>(new Set())

  const applyCycle = useCallback((response: EvaluationCycle) => {
    setCycle(response); setCycleName(response.cycleName); setStartDate(response.startDate)
    setEndDate(response.endDate); setPublishDate(response.plannedPublishDate)
  }, [])

  const loadItems = useCallback(async (templateId: number, preserve = false, warning?: string) => {
    const requestId = (itemsRequestIdsRef.current.get(templateId) ?? 0) + 1
    itemsRequestIdsRef.current.set(templateId, requestId)
    setItemsByTemplate((current) => { const next = new Map(current); const old = current.get(templateId); next.set(templateId, { loading: true, data: preserve ? old?.data ?? null : null, error: null, warning: null }); return next })
    try {
      const response = await fetchEvaluationItems(templateId)
      if (!mountedRef.current || itemsRequestIdsRef.current.get(templateId) !== requestId) return
      setItemsByTemplate((current) => { const next = new Map(current); next.set(templateId, { loading: false, data: response, error: null, warning: null }); return next })
    } catch (error) {
      if (!mountedRef.current || itemsRequestIdsRef.current.get(templateId) !== requestId) return
      setItemsByTemplate((current) => { const next = new Map(current); const old = current.get(templateId); next.set(templateId, { loading: false, data: preserve ? old?.data ?? null : null, error: preserve ? null : mapHrEvaluationErrorMessage(error, '평가 항목을 불러오지 못했습니다.'), warning: preserve ? warning ?? '목록을 다시 불러오지 못했습니다.' : null }); return next })
    }
  }, [])

  const loadCycle = useCallback(async () => {
    const requestId = ++latestCycleFetchIdRef.current; setCycleLoading(true); setCycleError(null)
    try { const response = await fetchEvaluationCycle(cycleId); if (mountedRef.current && requestId === latestCycleFetchIdRef.current) applyCycle(response) }
    catch (error) { if (mountedRef.current && requestId === latestCycleFetchIdRef.current) setCycleError(mapHrEvaluationErrorMessage(error, '평가 주기를 불러오지 못했습니다.')) }
    finally { if (mountedRef.current && requestId === latestCycleFetchIdRef.current) setCycleLoading(false) }
  }, [applyCycle, cycleId])

  const loadTemplates = useCallback(async () => {
    const requestId = ++latestTemplatesFetchIdRef.current; setTemplatesLoading(true); setTemplatesError(null)
    try { const response = await fetchEvaluationTemplates(cycleId); if (!mountedRef.current || requestId !== latestTemplatesFetchIdRef.current) return; setTemplates(response); for (const template of response) void loadItems(template.evaluationTemplateId) }
    catch (error) { if (mountedRef.current && requestId === latestTemplatesFetchIdRef.current) setTemplatesError(mapHrEvaluationErrorMessage(error, '평가 템플릿을 불러오지 못했습니다.')) }
    finally { if (mountedRef.current && requestId === latestTemplatesFetchIdRef.current) setTemplatesLoading(false) }
  }, [cycleId, loadItems])

  const loadOrganization = useCallback(async () => {
    const requestId = ++latestOrganizationFetchIdRef.current; setOrganizationLoading(true); setOrganizationError(null)
    try { const response = await fetchOrganization(); if (mountedRef.current && requestId === latestOrganizationFetchIdRef.current) setEmployees(flattenEmployees(response.departments)) }
    catch (error) { if (mountedRef.current && requestId === latestOrganizationFetchIdRef.current) setOrganizationError(mapHrEvaluationErrorMessage(error, '직원 목록을 불러오지 못했습니다.')) }
    finally { if (mountedRef.current && requestId === latestOrganizationFetchIdRef.current) setOrganizationLoading(false) }
  }, [])

  const loadProgress = useCallback(async () => {
    const requestId = ++latestProgressFetchIdRef.current; setProgressLoading(true); setProgressError(null)
    try { const response = await fetchEvaluationProgress(cycleId); if (mountedRef.current && requestId === latestProgressFetchIdRef.current) setProgress(response) }
    catch (error) { if (mountedRef.current && requestId === latestProgressFetchIdRef.current) setProgressError(mapHrEvaluationErrorMessage(error, '평가 진행 현황을 불러오지 못했습니다.')) }
    finally { if (mountedRef.current && requestId === latestProgressFetchIdRef.current) setProgressLoading(false) }
  }, [cycleId])

  useEffect(() => { const itemRequestIds = itemsRequestIdsRef.current; mountedRef.current = true; queueMicrotask(() => { void loadCycle(); void loadTemplates(); void loadOrganization(); void loadProgress() }); return () => { mountedRef.current = false; latestCycleFetchIdRef.current += 1; latestTemplatesFetchIdRef.current += 1; latestOrganizationFetchIdRef.current += 1; latestProgressFetchIdRef.current += 1; itemRequestIds.clear() } }, [loadCycle, loadOrganization, loadProgress, loadTemplates])

  async function saveCycle() {
    if (!cycle || cycleSaveRef.current) return
    if (!cycleName.trim() || !startDate || !endDate || !publishDate || startDate > endDate || publishDate < startDate) { setCycleSaveError('평가 주기명과 일정을 확인해 주세요.'); return }
    cycleSaveRef.current = true; setCycleSaving(true); setCycleSaveError(null); setCycleSaveSuccess(null)
    try { const response = await updateEvaluationCycle(cycleId, { cycleName, startDate, endDate, plannedPublishDate: publishDate }); if (mountedRef.current) { applyCycle(response); setCycleSaveSuccess('평가 주기가 수정되었습니다.') } }
    catch (error) { if (mountedRef.current) setCycleSaveError(mapHrEvaluationErrorMessage(error, '평가 주기를 수정하지 못했습니다.', '현재 평가 주기는 수정할 수 없습니다.')) }
    finally { cycleSaveRef.current = false; if (mountedRef.current) setCycleSaving(false) }
  }

  async function writeTemplate(type: EvaluationType, existing: EvaluationTemplate | undefined, name: string, description: string, active: boolean) {
    if (templateWriteRefs.current.get(type)) return
    templateWriteRefs.current.set(type, true)
    try {
      const response = existing
        ? await updateEvaluationTemplate(existing.evaluationTemplateId, { templateName: name, evaluationType: type, templateDescription: description === '' ? null : description, isActive: active })
        : await createEvaluationTemplate({ evaluationCycleId: cycleId, templateName: name, evaluationType: type, templateDescription: description === '' ? null : description, isActive: active })
      if (!mountedRef.current) return
      setTemplates((current) => existing ? current.map((entry) => entry.evaluationTemplateId === response.evaluationTemplateId ? response : entry) : [...current, response])
      if (!existing) setItemsByTemplate((current) => { const next = new Map(current); next.set(response.evaluationTemplateId, { loading: false, data: [], error: null, warning: null }); return next })
    } finally { templateWriteRefs.current.set(type, false) }
  }

  async function createItem(templateId: number, form: ItemForm) {
    const parsed = itemInput(form); if (!parsed || itemCreateRefs.current.get(templateId)) return
    itemCreateRefs.current.set(templateId, true)
    try {
      const response = await createEvaluationItem({ evaluationTemplateId: templateId, ...parsed } as EvaluationItemCreateInput)
      if (!mountedRef.current) return
      setItemsByTemplate((current) => { const next = new Map(current); const old = current.get(templateId); next.set(templateId, { loading: false, data: [...(old?.data ?? []), response], error: null, warning: null }); return next })
      await loadItems(templateId, true, '항목은 생성되었지만 목록을 다시 불러오지 못했습니다.')
    } finally { itemCreateRefs.current.set(templateId, false) }
  }

  async function saveItem(item: EvaluationItem, form: ItemForm) {
    const parsed = itemInput(form); if (!parsed || itemUpdateRefs.current.has(item.evaluationItemId)) return
    itemUpdateRefs.current.add(item.evaluationItemId)
    try {
      const response = await updateEvaluationItem(item.evaluationItemId, parsed)
      if (!mountedRef.current) return
      setItemsByTemplate((current) => { const next = new Map(current); const old = current.get(item.evaluationTemplateId); next.set(item.evaluationTemplateId, { loading: false, data: (old?.data ?? []).map((entry) => entry.evaluationItemId === response.evaluationItemId ? response : entry), error: null, warning: null }); return next })
      await loadItems(item.evaluationTemplateId, true, '항목은 수정되었지만 목록을 다시 불러오지 못했습니다.')
    } finally { itemUpdateRefs.current.delete(item.evaluationItemId) }
  }

  function handlePublished(evaluationId: number) {
    setLocallyPublishedEvaluationIds((current) => { const next = new Set(current); next.add(evaluationId); return next })
    void loadProgress()
  }

  const alreadyAssignedEmployeeIds = useMemo(() => progress && !progressLoading && !progressError ? new Set(progress.employees.map((entry) => entry.employee.employeeId)) : new Set<number>(), [progress, progressError, progressLoading])
  if (cycleLoading && !cycle) return <div role="status" aria-label="평가 주기를 불러오는 중"><Skeleton lines={6} /></div>
  if (cycleError && !cycle) return <div className={styles.errorState}><p className={styles.error} role="alert">{cycleError}</p><Button variant="secondary" onClick={() => void loadCycle()}>다시 시도</Button></div>
  if (!cycle) return null
  const editable = isCycleEditable(cycle.cycleStatus); const datesEditable = isCycleDatesEditable(cycle.cycleStatus); const setupWritable = isTemplateOrItemWritable(cycle.cycleStatus)
  return (
    <div className={styles.page}>
      <header className={styles.header}><div className={styles.heading}><h1>{cycle.cycleName}</h1><Badge variant={evaluationCycleStatusBadgeVariant(cycle.cycleStatus)}>{evaluationCycleStatusLabel(cycle.cycleStatus)}</Badge></div></header>
      <section className={styles.panel} aria-labelledby="cycle-info-title"><h2 id="cycle-info-title">평가 주기 정보</h2>
        {editable ? <div className={styles.formGrid}>
          <Field label="평가 주기명" id="detail-cycle-name" wide><input id="detail-cycle-name" disabled={!editable} maxLength={100} value={cycleName} onChange={(e) => setCycleName(e.target.value)} /></Field>
          <Field label="시작일" id="detail-cycle-start"><input id="detail-cycle-start" type="date" disabled={!datesEditable} value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
          <Field label="종료일" id="detail-cycle-end"><input id="detail-cycle-end" type="date" disabled={!datesEditable} value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
          <Field label="발행 예정일" id="detail-cycle-publish"><input id="detail-cycle-publish" type="date" disabled={!editable} value={publishDate} onChange={(e) => setPublishDate(e.target.value)} /></Field>
        </div> : <dl className={styles.readOnlyGrid}><div><dt>평가 주기명</dt><dd>{cycle.cycleName}</dd></div><div><dt>시작일</dt><dd>{cycle.startDate}</dd></div><div><dt>종료일</dt><dd>{cycle.endDate}</dd></div><div><dt>발행 예정일</dt><dd>{cycle.plannedPublishDate}</dd></div></dl>}
        {cycleSaveError && <p className={styles.error} role="alert">{cycleSaveError}</p>}{cycleSaveSuccess && <p className={styles.success} role="status">{cycleSaveSuccess}</p>}
        {editable && <div className={styles.actions}><Button loading={cycleSaving} onClick={() => void saveCycle()}>주기 수정</Button></div>}
      </section>
      <section aria-labelledby="templates-title"><h2 id="templates-title" className={styles.sectionTitle}>평가 템플릿</h2>
        {templatesLoading && templates.length === 0 ? <div role="status" aria-label="평가 템플릿을 불러오는 중"><Skeleton lines={4} /></div> : templatesError ? <div className={styles.errorState}><p className={styles.error} role="alert">{templatesError}</p><Button variant="secondary" onClick={() => void loadTemplates()}>템플릿 다시 시도</Button></div> : (
          <div className={styles.templateList}>{TEMPLATE_META.map(({ type, title }) => <TemplateSection key={type} title={title} type={type} template={templates.find((entry) => entry.evaluationType === type)} writable={setupWritable} itemsState={templates.find((entry) => entry.evaluationType === type) ? itemsByTemplate.get(templates.find((entry) => entry.evaluationType === type)!.evaluationTemplateId) : undefined} onWrite={writeTemplate} onRetryItems={loadItems} onCreateItem={createItem} onSaveItem={saveItem} />)}</div>
        )}
      </section>
      {organizationLoading ? <section aria-labelledby="assignment-loading-title"><h2 id="assignment-loading-title" className={styles.sectionTitle}>직원 배정</h2><div role="status" aria-label="직원 목록을 불러오는 중"><Skeleton lines={3} /></div></section> : organizationError ? <section aria-labelledby="assignment-error-title"><h2 id="assignment-error-title" className={styles.sectionTitle}>직원 배정</h2><div className={styles.errorState}><p className={styles.error} role="alert">{organizationError}</p><Button variant="secondary" onClick={() => void loadOrganization()}>직원 목록 다시 시도</Button></div></section> : <HrEvaluationAssignmentSection cycleId={cycleId} writable={isAssignmentWritable(cycle.cycleStatus)} employees={employees} alreadyAssignedEmployeeIds={alreadyAssignedEmployeeIds} onAssignSucceeded={() => void loadProgress()} />}
      <HrEvaluationProgressSection progress={progress} loading={progressLoading} error={progressError} onRetry={() => void loadProgress()} cycleStatus={cycle.cycleStatus} onPreparePublish={(evaluationId, employeeName) => setActivePublish({ evaluationId, employeeName })} locallyPublishedEvaluationIds={locallyPublishedEvaluationIds} />
      {activePublish && <div className={styles.publishPanel}><HrEvaluationPublishPanel key={activePublish.evaluationId} evaluationId={activePublish.evaluationId} employeeName={activePublish.employeeName} onClose={() => setActivePublish(null)} onPublished={handlePublished} /></div>}
    </div>
  )
}

function TemplateSection({ title, type, template, writable, itemsState, onWrite, onRetryItems, onCreateItem, onSaveItem }: { title: string; type: EvaluationType; template?: EvaluationTemplate; writable: boolean; itemsState?: ItemsState; onWrite: (type: EvaluationType, existing: EvaluationTemplate | undefined, name: string, description: string, active: boolean) => Promise<void>; onRetryItems: (id: number) => Promise<void>; onCreateItem: (id: number, form: ItemForm) => Promise<void>; onSaveItem: (item: EvaluationItem, form: ItemForm) => Promise<void> }) {
  const [name, setName] = useState(template?.templateName ?? '')
  const [description, setDescription] = useState(template?.templateDescription ?? '')
  const [active, setActive] = useState(template?.isActive ?? true)
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [templateSuccess, setTemplateSuccess] = useState<string | null>(null)
  const [templateWriting, setTemplateWriting] = useState(false)
  const [newItem, setNewItem] = useState<ItemForm>(EMPTY_ITEM)
  const [itemError, setItemError] = useState<string | null>(null)
  const [itemWriting, setItemWriting] = useState(false)
  async function submitTemplate() { if (!name.trim() || name.length > 100 || description.length > 1000) { setTemplateError('템플릿 이름과 설명을 확인해 주세요.'); return } setTemplateWriting(true); setTemplateError(null); setTemplateSuccess(null); try { await onWrite(type, template, name, description, active); setTemplateSuccess(template ? '템플릿이 수정되었습니다.' : '템플릿이 생성되었습니다.') } catch (error) { setTemplateError(mapHrEvaluationErrorMessage(error, '템플릿을 저장하지 못했습니다.', conflictMessage(error, template ? 'template-update' : 'template-create'))) } finally { setTemplateWriting(false) } }
  async function submitItem() { if (!template || !itemInput(newItem)) { setItemError('항목 이름, 순서와 가중치를 확인해 주세요.'); return } setItemWriting(true); setItemError(null); try { await onCreateItem(template.evaluationTemplateId, newItem); setNewItem(EMPTY_ITEM) } catch (error) { setItemError(mapHrEvaluationErrorMessage(error, '평가 항목을 생성하지 못했습니다.', conflictMessage(error, 'item-create'))) } finally { setItemWriting(false) } }
  return (
    <article className={styles.panel}><h3>{title}</h3>
      {writable ? <div className={styles.formGrid}><Field label="템플릿 이름" id={`template-name-${type}`} wide><input id={`template-name-${type}`} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} /></Field><Field label="설명" id={`template-description-${type}`} wide><textarea id={`template-description-${type}`} maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} /></Field><label className={styles.checkbox}><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />활성화</label>{templateError && <p className={styles.error} role="alert">{templateError}</p>}{templateSuccess && <p className={styles.success} role="status">{templateSuccess}</p>}<div className={styles.actions}><Button loading={templateWriting} onClick={() => void submitTemplate()}>{template ? '템플릿 수정' : '템플릿 생성'}</Button></div></div> : template ? <><p>{template.templateName}</p><p className={styles.meta}>{template.templateDescription ?? '설명이 없습니다.'} · {template.isActive ? '활성' : '비활성'}</p></> : <p className={styles.meta}>설정된 템플릿이 없습니다.</p>}
      {template && <section className={styles.itemsSection} aria-labelledby={`items-${type}`}><h4 id={`items-${type}`}>평가 항목</h4>
        {itemsState?.loading && !itemsState.data ? <div role="status" aria-label={`${title} 항목을 불러오는 중`}><Skeleton lines={3} /></div> : itemsState?.error ? <div className={styles.errorState}><p className={styles.error} role="alert">{itemsState.error}</p><Button size="sm" variant="secondary" onClick={() => void onRetryItems(template.evaluationTemplateId)}>항목 다시 시도</Button></div> : <><ul className={styles.itemList}>{(itemsState?.data ?? []).map((item) => <ItemEditor key={item.evaluationItemId} item={item} disabled={!writable || itemWriting} onSave={async (target, form) => { setItemWriting(true); setItemError(null); try { await onSaveItem(target, form) } catch (error) { setItemError(mapHrEvaluationErrorMessage(error, '평가 항목을 수정하지 못했습니다.', conflictMessage(error, 'item-update'))) } finally { setItemWriting(false) } }} />)}</ul>{itemsState?.data?.length === 0 && <p className={styles.meta}>등록된 평가 항목이 없습니다.</p>}</>}
        {itemsState?.warning && <p className={styles.warning} role="alert">{itemsState.warning}</p>}
        {writable && <div className={styles.createItem}><h5>평가 항목 추가</h5><div className={styles.formGrid}><Field label="항목명" id={`new-item-name-${type}`} wide><input id={`new-item-name-${type}`} maxLength={100} value={newItem.itemName} onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })} /></Field><Field label="순서" id={`new-item-order-${type}`}><input id={`new-item-order-${type}`} type="number" step="1" value={newItem.itemOrder} onChange={(e) => setNewItem({ ...newItem, itemOrder: e.target.value })} /></Field><Field label="가중치" id={`new-item-weight-${type}`}><input id={`new-item-weight-${type}`} inputMode="decimal" value={newItem.weight} onChange={(e) => setNewItem({ ...newItem, weight: e.target.value })} /></Field><Field label="설명" id={`new-item-description-${type}`} wide><textarea id={`new-item-description-${type}`} maxLength={1000} value={newItem.itemDescription} onChange={(e) => setNewItem({ ...newItem, itemDescription: e.target.value })} /></Field><label className={styles.checkbox}><input type="checkbox" checked={newItem.isRequired} onChange={(e) => setNewItem({ ...newItem, isRequired: e.target.checked })} />필수 항목</label><p className={styles.meta}>점수 범위 1~5</p>{itemError && <p className={styles.error} role="alert">{itemError}</p>}<div className={styles.actions}><Button loading={itemWriting} onClick={() => void submitItem()}>항목 생성</Button></div></div></div>}
      </section>}
    </article>
  )
}

export function HrEvaluationCycleDetailPage() {
  const { cycleId: value } = useParams(); const cycleId = Number(value); const valid = Number.isInteger(cycleId) && cycleId > 0
  return valid ? <HrEvaluationCycleDetailContent key={cycleId} cycleId={cycleId} /> : <p className={styles.error} role="alert">잘못된 평가 주기 정보입니다.</p>
}
