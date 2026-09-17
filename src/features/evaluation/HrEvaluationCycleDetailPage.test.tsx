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
  deleteEvaluationCycle: vi.fn(), closeEvaluationCycle: vi.fn(),
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
      root?.render(<MemoryRouter initialEntries={['/hr/evaluations/7']}><Routes><Route path="/hr/evaluations/:cycleId" element={<HrEvaluationCycleDetailPage />} /><Route path="/hr/evaluations" element={<p>평가 목록</p>} /></Routes></MemoryRouter>)
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

  it.each(['OPEN', 'CLOSED'] as const)('hides deletion outside the planned state: %s', async (status) => {
    evaluationApiMock.fetchEvaluationCycle.mockResolvedValue(cycle(status))
    await renderPage()
    expect(container.textContent).not.toContain('평가 삭제')
  })

  it('shows deletion for planned cycles and does not call the API when confirmation is cancelled', async () => {
    evaluationApiMock.deleteEvaluationCycle.mockResolvedValue(undefined)
    const confirm = vi.fn(() => false)
    Object.defineProperty(window, 'confirm', { configurable: true, value: confirm })
    await renderPage()
    const button = [...container.querySelectorAll('button')].find((entry) => entry.textContent === '평가 삭제')
    expect(button).not.toBeNull()
    await act(async () => button?.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(confirm).toHaveBeenCalled()
    expect(evaluationApiMock.deleteEvaluationCycle).not.toHaveBeenCalled()
  })

  it('deletes once and navigates to the list after confirmation', async () => {
    Object.defineProperty(window, 'confirm', { configurable: true, value: vi.fn(() => true) })
    evaluationApiMock.deleteEvaluationCycle.mockResolvedValue(undefined)
    await renderPage()
    const button = [...container.querySelectorAll('button')].find((entry) => entry.textContent === '평가 삭제')
    await act(async () => button?.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(evaluationApiMock.deleteEvaluationCycle).toHaveBeenCalledTimes(1)
    expect(container.textContent).toContain('평가 목록')
  })

  it('keeps the detail and shows an error when deletion fails', async () => {
    Object.defineProperty(window, 'confirm', { configurable: true, value: vi.fn(() => true) })
    evaluationApiMock.deleteEvaluationCycle.mockRejectedValue(new Error('failed'))
    await renderPage()
    const button = [...container.querySelectorAll('button')].find((entry) => entry.textContent === '평가 삭제')
    await act(async () => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })
    expect(evaluationApiMock.deleteEvaluationCycle).toHaveBeenCalledTimes(1)
    expect(container.textContent).toContain('평가를 삭제하지 못했습니다.')
  })

  it('prevents a duplicate deletion request while deletion is pending', async () => {
    Object.defineProperty(window, 'confirm', { configurable: true, value: vi.fn(() => true) })
    let completeDeletion: (() => void) | undefined
    const pendingDeletion = new Promise<void>((resolve) => {
      completeDeletion = resolve
    })
    evaluationApiMock.deleteEvaluationCycle.mockReturnValue(pendingDeletion)
    await renderPage()

    const button = [...container.querySelectorAll('button')].find((entry) => entry.textContent === '평가 삭제')
    expect(button).not.toBeNull()

    await act(async () => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })
    expect(evaluationApiMock.deleteEvaluationCycle).toHaveBeenCalledTimes(1)

    await act(async () => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })
    expect(evaluationApiMock.deleteEvaluationCycle).toHaveBeenCalledTimes(1)

    await act(async () => {
      completeDeletion?.()
      await pendingDeletion
    })
  })

  it('does not show early close for a planned cycle', async () => {
    await renderPage()
    expect([...container.querySelectorAll('button')].some((button) => button.textContent === '평가 마감')).toBe(false)
  })

  it('shows early close only for an open cycle', async () => {
    evaluationApiMock.fetchEvaluationCycle.mockResolvedValue(cycle('OPEN'))
    await renderPage()
    expect([...container.querySelectorAll('button')].some((button) => button.textContent === '평가 마감')).toBe(true)
    expect(container.textContent).not.toContain('평가 삭제')
  })

  it('does not show early close for a closed cycle', async () => {
    evaluationApiMock.fetchEvaluationCycle.mockResolvedValue(cycle('CLOSED'))
    await renderPage()
    expect([...container.querySelectorAll('button')].some((button) => button.textContent === '평가 마감')).toBe(false)
  })

  it('does not close when early-close confirmation is cancelled', async () => {
    evaluationApiMock.fetchEvaluationCycle.mockResolvedValue(cycle('OPEN'))
    Object.defineProperty(window, 'confirm', { configurable: true, value: vi.fn(() => false) })
    await renderPage()
    const button = [...container.querySelectorAll('button')].find((entry) => entry.textContent === '평가 마감')
    await act(async () => button?.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(evaluationApiMock.closeEvaluationCycle).not.toHaveBeenCalled()
  })

  it('calls early-close API after confirmation', async () => {
    evaluationApiMock.fetchEvaluationCycle.mockResolvedValue(cycle('OPEN'))
    evaluationApiMock.closeEvaluationCycle.mockResolvedValue(cycle('CLOSED'))
    Object.defineProperty(window, 'confirm', { configurable: true, value: vi.fn(() => true) })
    await renderPage()
    const button = [...container.querySelectorAll('button')].find((entry) => entry.textContent === '평가 마감')
    await act(async () => { button?.dispatchEvent(new MouseEvent('click', { bubbles: true })); await Promise.resolve() })
    expect(evaluationApiMock.closeEvaluationCycle).toHaveBeenCalledWith(7)
  })

  it('reflects CLOSED after successful early close', async () => {
    evaluationApiMock.fetchEvaluationCycle.mockResolvedValue(cycle('OPEN'))
    evaluationApiMock.closeEvaluationCycle.mockResolvedValue(cycle('CLOSED'))
    Object.defineProperty(window, 'confirm', { configurable: true, value: vi.fn(() => true) })
    await renderPage()
    const button = [...container.querySelectorAll('button')].find((entry) => entry.textContent === '평가 마감')
    await act(async () => { button?.dispatchEvent(new MouseEvent('click', { bubbles: true })); await Promise.resolve() })
    expect(container.textContent).toContain('마감')
    expect(container.textContent).not.toContain('평가 마감')
  })

  it('keeps open detail and shows an error when early close fails', async () => {
    evaluationApiMock.fetchEvaluationCycle.mockResolvedValue(cycle('OPEN'))
    evaluationApiMock.closeEvaluationCycle.mockRejectedValue(new Error('failed'))
    Object.defineProperty(window, 'confirm', { configurable: true, value: vi.fn(() => true) })
    await renderPage()
    const button = [...container.querySelectorAll('button')].find((entry) => entry.textContent === '평가 마감')
    await act(async () => { button?.dispatchEvent(new MouseEvent('click', { bubbles: true })); await Promise.resolve() })
    expect(container.textContent).toContain('평가를 마감하지 못했습니다.')
    expect([...container.querySelectorAll('button')].some((entry) => entry.textContent === '평가 마감')).toBe(true)
  })

  it('prevents duplicate early-close requests while pending', async () => {
    evaluationApiMock.fetchEvaluationCycle.mockResolvedValue(cycle('OPEN'))
    Object.defineProperty(window, 'confirm', { configurable: true, value: vi.fn(() => true) })
    let complete: (() => void) | undefined
    const pending = new Promise<EvaluationCycle>((resolve) => { complete = () => resolve(cycle('CLOSED')) })
    evaluationApiMock.closeEvaluationCycle.mockReturnValue(pending)
    await renderPage()
    const button = [...container.querySelectorAll('button')].find((entry) => entry.textContent === '평가 마감') as HTMLButtonElement
    await act(async () => { button.click(); await Promise.resolve() })
    expect(button.disabled).toBe(true)
    await act(async () => { button.click(); await Promise.resolve() })
    expect(evaluationApiMock.closeEvaluationCycle).toHaveBeenCalledTimes(1)
    await act(async () => { complete?.(); await pending })
  })
})
