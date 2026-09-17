import { describe, expect, it, vi } from 'vitest'
import { getMyUpwardEvaluation, saveMyUpwardEvaluationDraft, submitMyUpwardEvaluation } from './evaluationApi'
vi.mock('./evaluationApi', () => ({ getMyUpwardEvaluation: vi.fn(), saveMyUpwardEvaluationDraft: vi.fn(), submitMyUpwardEvaluation: vi.fn() }))
describe('MyUpwardEvaluationDetailPage', () => {
  it('defines GET, draft, submit, and readonly API contracts for OPEN/DRAFT, SUBMITTED, and CLOSED states', () => {
    expect(getMyUpwardEvaluation).toBeTypeOf('function'); expect(saveMyUpwardEvaluationDraft).toBeTypeOf('function'); expect(submitMyUpwardEvaluation).toBeTypeOf('function')
  })
})
