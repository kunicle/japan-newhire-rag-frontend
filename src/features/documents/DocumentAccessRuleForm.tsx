import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '../../shared/ui'
import type { RoleType } from '../auth/types'
import { fetchJobGrades, fetchOrganization } from '../organization/organizationApi'
import { flattenDepartments } from '../organization/organizationHelpers'
import {
  buildAccessRuleRequest,
  buildAccessRuleSummaryLines,
  isAccessRuleFormValid,
  ROLE_LABELS,
  type AccessRuleFormSnapshot,
  type AccessRuleReferences,
} from './accessRuleFormHelpers'
import { updateDocumentAccessRule } from './documentApi'
import { mapDocumentErrorMessage } from './documentErrors'
import type {
  AccessScope,
  ConditionOperator,
  DocumentAccessRuleResult,
} from './types'
import styles from './DocumentAccessRuleForm.module.css'

const REFERENCE_ERROR_MESSAGE =
  '부서/직급 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
const SAVE_ERROR_MESSAGE =
  '접근 범위를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'
const ROLES: RoleType[] = ['EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'SYSTEM_ADMIN']

interface DocumentAccessRuleFormProps {
  documentId: number
  documentVersionId: number
  initialConfiguration?: AccessRuleFormSnapshot | null
  onSaved: (
    result: DocumentAccessRuleResult,
    configuration: AccessRuleFormSnapshot,
    summaryLines: string[],
  ) => void
  onCancel?: () => void
}

export function DocumentAccessRuleForm({
  documentId,
  documentVersionId,
  initialConfiguration,
  onSaved,
  onCancel,
}: DocumentAccessRuleFormProps) {
  const [accessScope, setAccessScope] = useState<AccessScope | null>(
    initialConfiguration?.accessScope ?? null,
  )
  const [conditionOperator, setConditionOperator] =
    useState<ConditionOperator | null>(initialConfiguration?.conditionOperator ?? null)
  const [selectedRoles, setSelectedRoles] = useState<Set<RoleType>>(
    new Set(initialConfiguration?.roles ?? []),
  )
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<Set<number>>(
    new Set(initialConfiguration?.departmentIds ?? []),
  )
  const [minimumJobGradeId, setMinimumJobGradeId] = useState<number | null>(
    initialConfiguration?.minimumJobGradeId ?? null,
  )
  const [newEmployeeOnly, setNewEmployeeOnly] = useState(
    initialConfiguration?.newEmployeeOnly ?? false,
  )
  const [references, setReferences] = useState<AccessRuleReferences | null>(null)
  const [referencesLoading, setReferencesLoading] = useState(false)
  const [referencesError, setReferencesError] = useState<string | null>(null)
  const [savingAccessRule, setSavingAccessRule] = useState(false)
  const [accessRuleError, setAccessRuleError] = useState<string | null>(null)
  const savingAccessRuleRef = useRef(false)
  const referenceFetchIdRef = useRef(0)

  const loadReferences = useCallback(async () => {
    const requestId = ++referenceFetchIdRef.current
    setReferencesLoading(true)
    setReferencesError(null)

    try {
      const [organization, jobGrades] = await Promise.all([
        fetchOrganization(),
        fetchJobGrades(),
      ])
      if (requestId !== referenceFetchIdRef.current) return
      setReferences({
        departments: flattenDepartments(organization.departments),
        jobGrades,
      })
    } catch {
      if (requestId !== referenceFetchIdRef.current) return
      setReferences(null)
      setReferencesError(REFERENCE_ERROR_MESSAGE)
    } finally {
      if (requestId === referenceFetchIdRef.current) setReferencesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (accessScope === 'RESTRICTED' && references === null && !referencesLoading && !referencesError) {
      queueMicrotask(() => void loadReferences())
    }
  }, [accessScope, loadReferences, references, referencesError, referencesLoading])

  useEffect(() => () => {
    referenceFetchIdRef.current += 1
  }, [])

  const snapshot: AccessRuleFormSnapshot = {
    accessScope,
    conditionOperator,
    roles: [...selectedRoles],
    departmentIds: [...selectedDepartmentIds],
    minimumJobGradeId,
    newEmployeeOnly,
  }
  const formValid = isAccessRuleFormValid(snapshot)
  const referencesReady = references !== null && !referencesLoading && referencesError === null
  const canSave = accessScope === 'ALL'
    ? formValid
    : formValid && referencesReady

  function toggleRole(role: RoleType) {
    setSelectedRoles((current) => {
      const next = new Set(current)
      if (next.has(role)) next.delete(role)
      else next.add(role)
      return next
    })
  }

  function toggleDepartment(departmentId: number) {
    setSelectedDepartmentIds((current) => {
      const next = new Set(current)
      if (next.has(departmentId)) next.delete(departmentId)
      else next.add(departmentId)
      return next
    })
  }

  async function handleSave() {
    if (savingAccessRuleRef.current) return
    const configuration: AccessRuleFormSnapshot = {
      accessScope,
      conditionOperator,
      roles: [...selectedRoles],
      departmentIds: [...selectedDepartmentIds],
      minimumJobGradeId,
      newEmployeeOnly,
    }
    const valid = isAccessRuleFormValid(configuration)
    const ready = references !== null && !referencesLoading && referencesError === null
    if (!valid || (configuration.accessScope === 'RESTRICTED' && !ready)) return

    savingAccessRuleRef.current = true
    setSavingAccessRule(true)
    setAccessRuleError(null)
    try {
      const result = await updateDocumentAccessRule(
        documentId,
        documentVersionId,
        buildAccessRuleRequest(configuration),
      )
      onSaved(
        result,
        configuration,
        buildAccessRuleSummaryLines(configuration, references),
      )
    } catch (error) {
      setAccessRuleError(mapDocumentErrorMessage(error, SAVE_ERROR_MESSAGE))
    } finally {
      savingAccessRuleRef.current = false
      setSavingAccessRule(false)
    }
  }

  return (
    <div className={styles.form}>
      <fieldset className={styles.fieldset} disabled={savingAccessRule}>
        <legend className={styles.legend}>접근 범위</legend>
        <label className={styles.choiceRow}>
          <input type="radio" name="access-scope" checked={accessScope === 'ALL'}
            onChange={() => setAccessScope('ALL')} />
          <span>전체 직원</span>
        </label>
        <label className={styles.choiceRow}>
          <input type="radio" name="access-scope" checked={accessScope === 'RESTRICTED'}
            onChange={() => setAccessScope('RESTRICTED')} />
          <span>조건부 공개</span>
        </label>
      </fieldset>

      {accessScope === 'RESTRICTED' && (
        <div className={styles.restrictedFields}>
          {referencesLoading && <p role="status">부서/직급 정보를 불러오는 중...</p>}
          {referencesError && (
            <div className={styles.referenceError}>
              <p className={styles.error} role="alert">{referencesError}</p>
              <Button type="button" variant="secondary" disabled={savingAccessRule}
                onClick={() => void loadReferences()}>다시 시도</Button>
            </div>
          )}
          <fieldset className={styles.fieldset} disabled={savingAccessRule}>
            <legend className={styles.legend}>조건 방식</legend>
            <label className={styles.choiceRow}>
              <input type="radio" name="condition-operator"
                checked={conditionOperator === 'AND'} onChange={() => setConditionOperator('AND')} />
              <span>AND — 선택한 모든 조건을 만족해야 합니다.</span>
            </label>
            <label className={styles.choiceRow}>
              <input type="radio" name="condition-operator"
                checked={conditionOperator === 'OR'} onChange={() => setConditionOperator('OR')} />
              <span>OR — 선택한 조건 중 하나 이상을 만족하면 됩니다.</span>
            </label>
          </fieldset>
          <fieldset className={styles.fieldset} disabled={savingAccessRule}>
            <legend className={styles.legend}>역할</legend>
            {ROLES.map((role) => (
              <label className={styles.choiceRow} key={role}>
                <input type="checkbox" checked={selectedRoles.has(role)}
                  onChange={() => toggleRole(role)} />
                <span>{ROLE_LABELS[role]}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className={styles.fieldset} disabled={savingAccessRule || !referencesReady}>
            <legend className={styles.legend}>부서</legend>
            {references && references.departments.length === 0 && <p>선택 가능한 부서가 없습니다.</p>}
            {references && references.departments.length > 0 && (
              <div className={styles.departmentList}>
                {references.departments.map((department) => (
                  <label className={styles.departmentRow} key={department.departmentId}
                    style={{ paddingInlineStart: `calc(${department.depth} * var(--space-4))` }}>
                    <input type="checkbox" checked={selectedDepartmentIds.has(department.departmentId)}
                      onChange={() => toggleDepartment(department.departmentId)} />
                    <span>{department.departmentName}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          <div className={styles.selectField}>
            <label htmlFor="minimum-job-grade">최소 직급</label>
            <select id="minimum-job-grade" value={minimumJobGradeId ?? ''}
              disabled={savingAccessRule || !referencesReady}
              onChange={(event) => setMinimumJobGradeId(event.target.value ? Number(event.target.value) : null)}>
              <option value="">조건 없음</option>
              {references?.jobGrades.map((grade) => (
                <option key={grade.jobGradeId} value={grade.jobGradeId}>
                  {grade.jobGradeName} (Level {grade.jobGradeLevel})
                </option>
              ))}
            </select>
            {references && references.jobGrades.length === 0 && <p>선택 가능한 직급이 없습니다.</p>}
            <p>선택한 직급의 Level 이상인 사용자</p>
          </div>
          <label className={styles.choiceRow}>
            <input type="checkbox" checked={newEmployeeOnly} disabled={savingAccessRule}
              onChange={(event) => setNewEmployeeOnly(event.target.checked)} />
            <span>신입사원만 접근 허용</span>
          </label>
        </div>
      )}

      {accessRuleError && <p className={styles.error} role="alert">{accessRuleError}</p>}
      {savingAccessRule && <p className={styles.status} role="status">접근 범위를 저장하고 있습니다...</p>}
      <div className={styles.actions}>
        {onCancel && <Button type="button" variant="secondary" disabled={savingAccessRule} onClick={onCancel}>취소</Button>}
        <Button type="button" loading={savingAccessRule} disabled={savingAccessRule || !canSave}
          onClick={() => void handleSave()}>접근 범위 저장</Button>
      </div>
    </div>
  )
}
