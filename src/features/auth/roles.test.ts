import { describe, expect, it } from 'vitest'
import { hasAnyRole } from './roles'

describe('hasAnyRole', () => {
  it('returns true when a role overlaps', () => {
    expect(hasAnyRole(['EMPLOYEE', 'MANAGER'], ['MANAGER'])).toBe(true)
  })

  it('returns false when roles do not overlap', () => {
    expect(hasAnyRole(['EMPLOYEE'], ['HR_MANAGER'])).toBe(false)
  })

  it('returns false when user roles are empty', () => {
    expect(hasAnyRole([], ['MANAGER'])).toBe(false)
  })

  it('returns false when allowed roles are empty', () => {
    expect(hasAnyRole(['MANAGER'], [])).toBe(false)
  })
})
