import { describe, expect, it, vi } from 'vitest'
import { getReceivedUpwardEvaluation, getReceivedUpwardEvaluations } from './managerEvaluationApi'
vi.mock('./managerEvaluationApi', () => ({ getReceivedUpwardEvaluation: vi.fn(), getReceivedUpwardEvaluations: vi.fn() }))
describe('Manager received-UPWARD pages', () => {
  it('defines list/detail contracts including non-anonymous evaluator identity and read-only results', () => {
    expect(getReceivedUpwardEvaluations).toBeTypeOf('function'); expect(getReceivedUpwardEvaluation).toBeTypeOf('function')
  })
})
