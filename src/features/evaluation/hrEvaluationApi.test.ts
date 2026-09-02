import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../shared/api/httpClient'
import {
  createEvaluationCycle, createEvaluationItem, createEvaluationTemplate,
  fetchEvaluationCycle, fetchEvaluationItems, fetchEvaluationTemplates,
  updateEvaluationCycle, updateEvaluationItem, updateEvaluationTemplate,
} from './hrEvaluationApi'

vi.mock('../../shared/api/httpClient', () => ({ request: vi.fn() }))
const requestMock = vi.mocked(request)
const cycleInput = { cycleName: '2027', startDate: '2027-01-01', endDate: '2027-01-31', plannedPublishDate: '2027-02-01' }
const templateCreate = { evaluationCycleId: 3, templateName: 'Self', evaluationType: 'SELF' as const, templateDescription: null, isActive: true }
const templateUpdate = { templateName: 'Manager', evaluationType: 'MANAGER' as const, templateDescription: 'desc', isActive: false }
const itemCreate = { evaluationTemplateId: 4, itemName: '성과', itemDescription: null, itemOrder: 1, weight: 50, isRequired: true, minimumScore: 1, maximumScore: 5 }
const itemUpdate = { itemName: '협업', itemDescription: 'desc', itemOrder: 2, weight: 25.5, isRequired: false, minimumScore: 1, maximumScore: 5 }

describe('hrEvaluationApi', () => {
  beforeEach(() => requestMock.mockReset().mockResolvedValue({}))
  it('creates a cycle', async () => { await createEvaluationCycle(cycleInput); expect(requestMock).toHaveBeenCalledWith('/hr/evaluation-cycles', { method: 'POST', body: JSON.stringify(cycleInput) }) })
  it('fetches a cycle', async () => { await fetchEvaluationCycle(3); expect(requestMock).toHaveBeenCalledWith('/hr/evaluation-cycles/3') })
  it('updates a cycle', async () => { await updateEvaluationCycle(3, cycleInput); expect(requestMock).toHaveBeenCalledWith('/hr/evaluation-cycles/3', { method: 'PATCH', body: JSON.stringify(cycleInput) }) })
  it('fetches cycle templates', async () => { await fetchEvaluationTemplates(3); expect(requestMock).toHaveBeenCalledWith('/hr/evaluation-cycles/3/templates') })
  it('creates a template', async () => { await createEvaluationTemplate(templateCreate); expect(requestMock).toHaveBeenCalledWith('/hr/evaluation-templates', { method: 'POST', body: JSON.stringify(templateCreate) }) })
  it('updates a template', async () => { await updateEvaluationTemplate(4, templateUpdate); expect(requestMock).toHaveBeenCalledWith('/hr/evaluation-templates/4', { method: 'PATCH', body: JSON.stringify(templateUpdate) }) })
  it('fetches template items', async () => { await fetchEvaluationItems(4); expect(requestMock).toHaveBeenCalledWith('/hr/evaluation-templates/4/items') })
  it('creates an item', async () => { await createEvaluationItem(itemCreate); expect(requestMock).toHaveBeenCalledWith('/hr/evaluation-items', { method: 'POST', body: JSON.stringify(itemCreate) }) })
  it('updates an item', async () => { await updateEvaluationItem(5, itemUpdate); expect(requestMock).toHaveBeenCalledWith('/hr/evaluation-items/5', { method: 'PATCH', body: JSON.stringify(itemUpdate) }) })
})
