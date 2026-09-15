import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HrEvaluationCycleDetailPage } from './HrEvaluationCycleDetailPage'
import type { EvaluationCycle, EvaluationProgress, EvaluationTemplate } from './hrEvaluationTypes'

const evaluationApiMock = vi.hoisted(() => ({
  fetchEvaluationCycle: vi.fn(), fetchEvaluationTemplates: vi.fn(), fetchEvaluationItems: vi.fn(),
  fetchEvaluationProgress: vi.fn(), createEvaluationItem: vi.fn(), createEvaluationTemplate: vi.fn(),
  updateEvaluationCycle: vi.fn(), updateEvaluationItem: vi.fn(), updateEvaluationTemplate: vi.fn(),
}))
const organizationApiMock = vi.hoisted(() => ({ fetchOrganization: vi.fn() }))

vi.mock('./hrEvaluationApi', () => evaluationApiMock)
vi.mock('../organization/organizationApi', () => organizationApiMock)

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function cycle(cycleStatus: EvaluationCycle['cycleStatus']): EvaluationCycle {
  return { evaluationCycleId: 7, cycleName: '2026 하반기 평가', startDate: '2026-09-01', endDate: '2026-09-30', plannedPublishDate: '2026-10-07', cycleStatus, createdBy: 1, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }
}

const selfEvaluation: EvaluationTemplate = { evaluationTemplateId: 11, evaluationCycleId: 7, templateName: '자기 평가', evaluationType: 'SELF', templateDescription: null, isActive: true, createdBy: 1, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }
const progress: EvaluationProgress = { cycleId: 7, cycleName: '2026 하반기 평가', startDate: '2026-09-01', endDate: '2026-09-30', currentCycleStatus: 'PLANNED', totalTargetCount: 0, selfSummary: { notStartedCount: 0, inProgressCount: 0, submittedCount: 0 }, managerSummary: { notStartedCount: 0, inProgressCount: 0, submittedCount: 0 }, employees: [] }

describe('HrEvaluationCycleDetailPage', () => {
  let container: HTMLDivElement
  let root: Root | null

  beforeEach(() => {
    Object.values(evaluationApiMock).forEach((mock) => mock.mockReset())
    evaluationApiMock.fetchEvaluationCycle.mockResolvedValue(cycle('PLANNED'))
    evaluationApiMock.fetchEvaluationTemplates.mockResolvedValue([selfEvaluation])
    evaluationApiMock.fetchEvaluationItems.mockResolvedValue([])
    evaluationApiMock.fetchEvaluationProgress.mockResolvedValue(progress)
    organizationApiMock.fetchOrganization.mockReset()
    organizationApiMock.fetchOrganization.mockResolvedValue({ departments: [] })
    root = null
    container = document.createElement('div')
    document.body.append(container)
  })

  afterEach(async () => {
    if (root) await act(async () => root?.unmount())
    container.remove()
  })

  async function renderPage() {
    root = createRoot(container)
    await act(async () => {
      root?.render(<MemoryRouter initialEntries={['/hr/evaluations/7']}><Routes><Route path="/hr/evaluations/:cycleId" element={<HrEvaluationCycleDetailPage />} /></Routes></MemoryRouter>)
      await Promise.resolve()
    })
  }

  it('shows setup controls and question addition for a planned cycle', async () => {
    await renderPage()

    expect(container.querySelector('#template-name-SELF')).not.toBeNull()
    expect(container.querySelector('#template-name-MANAGER')).not.toBeNull()
    expect(container.textContent).toContain('등록된 평가 질문이 없습니다.')
    expect(container.textContent).toContain('평가 질문 추가')
  })

  it('explains read-only setup and links to the evaluation list outside the planned state', async () => {
    evaluationApiMock.fetchEvaluationCycle.mockResolvedValue(cycle('OPEN'))
    await renderPage()

    expect(container.textContent).toContain('현재 평가 주기 상태에서는 평가 설정과 평가 질문을 수정할 수 없습니다.')
    expect(container.querySelector('#template-name-SELF')).toBeNull()
    expect(container.textContent).not.toContain('평가 질문 추가')
    const backLink = [...container.querySelectorAll('a')].find((link) => link.textContent === '평가 목록으로 돌아가기')
    expect(backLink?.getAttribute('href')).toBe('/hr/evaluations')
  })
})
