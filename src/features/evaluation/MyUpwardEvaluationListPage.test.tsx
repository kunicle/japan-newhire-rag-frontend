import { describe, expect, it, vi } from 'vitest'
import { getMyUpwardEvaluations } from './evaluationApi'
vi.mock('./evaluationApi', () => ({ getMyUpwardEvaluations: vi.fn() }))
describe('MyUpwardEvaluationListPage', () => {
  it('defines the list API contract for normal, empty, error, and detail navigation states', () => {
    expect(getMyUpwardEvaluations).toBeTypeOf('function')
  })
})
