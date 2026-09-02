import { useEffect, useRef, useState } from 'react'
import type { FlatEmployee } from '../organization/organizationHelpers'
import { Button } from '../../shared/ui'
import { assignEvaluation } from './hrEvaluationApi'
import { mapAssignmentErrorMessage } from './hrEvaluationHelpers'
import styles from './HrEvaluationListPage.module.css'

interface Props { cycleId: number; writable: boolean; employees: FlatEmployee[]; alreadyAssignedEmployeeIds: Set<number>; onAssignSucceeded: () => void }
type RowResult = { status: 'success' | 'failure'; message?: string }

export function HrEvaluationAssignmentSection({ cycleId, writable, employees, alreadyAssignedEmployeeIds, onAssignSucceeded }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [rowResults, setRowResults] = useState<Map<number, RowResult>>(new Map())
  const [assigning, setAssigning] = useState(false)
  const assigningRef = useRef(false)
  const mountedRef = useRef(false)
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])
  const availableEmployees = employees.filter((employee) => !alreadyAssignedEmployeeIds.has(employee.employeeId) || rowResults.has(employee.employeeId))

  function toggle(employeeId: number) {
    setSelectedIds((current) => { const next = new Set(current); if (next.has(employeeId)) next.delete(employeeId); else next.add(employeeId); return next })
    setRowResults((current) => { const next = new Map(current); next.delete(employeeId); return next })
  }

  async function assignSelected() {
    if (assigningRef.current || selectedIds.size === 0) return
    assigningRef.current = true; setAssigning(true)
    let anySucceeded = false
    for (const employeeId of [...selectedIds]) {
      if (!mountedRef.current) break
      try {
        await assignEvaluation({ evaluationCycleId: cycleId, targetEmployeeId: employeeId })
        if (!mountedRef.current) break
        anySucceeded = true
        setSelectedIds((current) => { const next = new Set(current); next.delete(employeeId); return next })
        setRowResults((current) => new Map(current).set(employeeId, { status: 'success' }))
      } catch (error) {
        if (!mountedRef.current) break
        setRowResults((current) => new Map(current).set(employeeId, { status: 'failure', message: mapAssignmentErrorMessage(error, '배정하지 못했습니다.') }))
      }
    }
    assigningRef.current = false
    if (!mountedRef.current) return
    setAssigning(false)
    if (anySucceeded) onAssignSucceeded()
  }

  return <section className={styles.section} aria-labelledby="assignment-title">
    <h2 id="assignment-title">직원 배정</h2>
    {!writable ? <p className={styles.meta}>현재 평가 주기 상태에서는 직원을 배정할 수 없습니다.</p> : <div className={styles.panel}>
      {availableEmployees.length === 0 ? <p className={styles.meta}>배정 가능한 직원이 없습니다.</p> : <ul className={styles.employeeList}>{availableEmployees.map((employee) => { const result = rowResults.get(employee.employeeId); return <li className={styles.employeeRow} key={employee.employeeId}><label className={styles.employeeMain}><input type="checkbox" checked={selectedIds.has(employee.employeeId)} disabled={assigning || result?.status === 'success'} onChange={() => toggle(employee.employeeId)} /><span className={styles.employeeText}><strong>{employee.employeeName}</strong><span className={styles.meta}>{employee.departmentName} · {employee.jobGradeName ?? '직급 미지정'}</span>{result?.status === 'success' && <span className={styles.success} role="status">배정되었습니다.</span>}{result?.status === 'failure' && <span className={styles.error} role="alert">{result.message}</span>}</span></label></li> })}</ul>}
      <div className={styles.actions}><Button loading={assigning} disabled={selectedIds.size === 0} onClick={() => void assignSelected()}>선택 직원 배정</Button></div>
    </div>}
  </section>
}
