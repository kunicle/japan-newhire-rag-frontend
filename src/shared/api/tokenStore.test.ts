import { afterEach, describe, expect, it } from 'vitest'
import { getAccessToken, setAccessToken } from './tokenStore'

describe('tokenStore', () => {
  afterEach(() => setAccessToken(null))

  it('returns the token stored in memory', () => {
    setAccessToken('access-token')
    expect(getAccessToken()).toBe('access-token')
  })

  it('clears the token with null', () => {
    setAccessToken('access-token')
    setAccessToken(null)
    expect(getAccessToken()).toBeNull()
  })
})
