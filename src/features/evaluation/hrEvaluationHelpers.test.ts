import { describe, expect, it } from 'vitest'
import { AppError } from '../../shared/api/errors'
import type { EvaluationStatus } from './evaluationTypes'
import { getPublishEvaluationId, isAssignmentWritable, isCycleDatesEditable, isCycleEditable, isPublishCandidate, isPublished, isTemplateOrItemWritable, mapAssignmentErrorMessage, mapHrEvaluationErrorMessage, mapPublishErrorMessage, progressStatusBadgeVariant, progressStatusLabel } from './hrEvaluationHelpers'
import type { EvaluationProgressDetail, EvaluationProgressEmployee } from './hrEvaluationTypes'

function detail(evaluationId: number, evaluationStatus: EvaluationStatus): EvaluationProgressDetail { return { evaluationId, evaluationStatus, progressStatus: evaluationStatus === 'DRAFT' ? 'IN_PROGRESS' : 'SUBMITTED', submittedAt: null } }
function entry(selfEvaluation: EvaluationProgressDetail | null, managerEvaluation: EvaluationProgressDetail | null): EvaluationProgressEmployee { return { employee: { employeeId: 1, employeeName: '직원', departmentId: null, departmentName: null, jobGradeId: null, jobGradeName: null }, selfEvaluation, managerEvaluation } }

describe('HR evaluation helpers', () => {
  it.each([['PLANNED', true], ['OPEN', true], ['CLOSED', false]] as const)('maps cycle editability for %s', (status, expected) => expect(isCycleEditable(status)).toBe(expected))
  it.each([['PLANNED', true], ['OPEN', false], ['CLOSED', false]] as const)('maps date editability for %s', (status, expected) => expect(isCycleDatesEditable(status)).toBe(expected))
  it.each([['PLANNED', true], ['OPEN', false], ['CLOSED', false]] as const)('maps setup writability for %s', (status, expected) => expect(isTemplateOrItemWritable(status)).toBe(expected))
  it.each([
    [400, 'BAD', '입력 내용을 확인해 주세요.'], [403, 'DENIED', '평가 관리 권한이 없습니다.'],
    [404, 'MISSING', '요청한 항목을 찾을 수 없습니다.'], [409, 'CONFLICT', 'custom'],
    [500, 'ERROR', 'fallback'],
  ])('maps status %i safely', (status, code, expected) => expect(mapHrEvaluationErrorMessage(new AppError(status, code, 'raw'), 'fallback', 'custom')).toBe(expected))
  it('uses the default conflict message', () => expect(mapHrEvaluationErrorMessage(new AppError(409, 'CONFLICT', 'raw'), 'fallback')).toBe('현재 상태에서는 처리할 수 없습니다.'))
  it('uses fallback for non-AppError', () => expect(mapHrEvaluationErrorMessage(new Error('raw'), 'fallback')).toBe('fallback'))
  it.each([['NOT_STARTED', '시작 전'], ['IN_PROGRESS', '작성 중'], ['SUBMITTED', '제출 완료']] as const)('labels progress %s', (status, expected) => expect(progressStatusLabel(status)).toBe(expected))
  it.each([['NOT_STARTED', 'neutral'], ['IN_PROGRESS', 'info'], ['SUBMITTED', 'success']] as const)('maps progress badge %s', (status, expected) => expect(progressStatusBadgeVariant(status)).toBe(expected))
  it.each([['PLANNED', true], ['OPEN', false], ['CLOSED', false]] as const)('maps assignment writability for %s', (status, expected) => expect(isAssignmentWritable(status)).toBe(expected))
  it.each([
    ['EVALUATION_DUPLICATE_ASSIGNMENT', '이미 해당 평가 주기에 배정된 직원입니다.'],
    ['EVALUATION_MANAGER_RELATION_INVALID', '유효한 직속 관리자가 없어 평가를 배정할 수 없습니다.'],
    ['EVALUATION_TEMPLATE_NOT_READY', '자기/관리자 평가 템플릿과 평가 항목 설정을 확인해 주세요.'],
    ['EVALUATION_CYCLE_NOT_ASSIGNABLE', '현재 평가 주기에는 직원을 배정할 수 없습니다.'],
    ['EVALUATION_TARGET_INVALID', '유효한 직원을 선택해 주세요.'],
  ])('maps assignment error %s', (code, expected) => expect(mapAssignmentErrorMessage(new AppError(409, code, 'raw'), 'fallback')).toBe(expected))
  it('delegates generic assignment conflicts', () => expect(mapAssignmentErrorMessage(new AppError(409, 'OTHER', 'raw'), 'fallback')).toBe('현재 상태에서는 처리할 수 없습니다.'))
  it('uses assignment fallback for non-AppError', () => expect(mapAssignmentErrorMessage(new Error('raw'), 'fallback')).toBe('fallback'))
  it('recognizes only a fully published pair', () => { expect(isPublished(entry(detail(1, 'PUBLISHED'), detail(2, 'PUBLISHED')))).toBe(true); expect(isPublished(entry(detail(1, 'PUBLISHED'), detail(2, 'SUBMITTED')))).toBe(false); expect(isPublished(entry(null, detail(2, 'PUBLISHED')))).toBe(false) })
  it('selects manager evaluation id first', () => { expect(getPublishEvaluationId(entry(detail(1, 'SUBMITTED'), detail(2, 'SUBMITTED')))).toBe(2); expect(getPublishEvaluationId(entry(detail(1, 'SUBMITTED'), null))).toBe(1); expect(getPublishEvaluationId(entry(null, null))).toBeNull() })
  it('applies the minimal publish candidate gate', () => { const pair = entry(detail(1, 'SUBMITTED'), detail(2, 'SUBMITTED')); expect(isPublishCandidate('OPEN', pair)).toBe(false); expect(isPublishCandidate('PLANNED', pair)).toBe(false); expect(isPublishCandidate('CLOSED', entry(null, detail(2, 'SUBMITTED')))).toBe(false); expect(isPublishCandidate('CLOSED', entry(detail(1, 'SUBMITTED'), null))).toBe(false); expect(isPublishCandidate('CLOSED', entry(detail(1, 'PUBLISHED'), detail(2, 'PUBLISHED')))).toBe(false); expect(isPublishCandidate('CLOSED', pair)).toBe(true) })
  it.each([
    ['EVALUATION_NOT_PUBLISHABLE', '현재 평가 결과를 발행할 수 없습니다.'],
    ['EVALUATION_PUBLISH_CONFLICT', '평가 발행 상태가 일치하지 않습니다. 진행 상태를 다시 확인해 주세요.'],
    ['EVALUATION_FEEDBACK_INVALID', '공개할 관리자 피드백 정보를 다시 확인해 주세요.'],
  ])('maps publish error %s', (code, expected) => expect(mapPublishErrorMessage(new AppError(409, code, 'raw'), 'fallback')).toBe(expected))
  it('uses a safe generic publish fallback', () => expect(mapPublishErrorMessage(new Error('raw'), 'fallback')).toBe('fallback'))
})
