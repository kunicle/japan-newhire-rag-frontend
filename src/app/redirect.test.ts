import { describe, expect, it } from 'vitest'
import { resolveRedirectPath } from './redirect'

describe('resolveRedirectPath', () => {
  it.each(['/hr/documents/upload', '/rag?foo=bar'])(
    'preserves internal path %s',
    (path) => {
      expect(resolveRedirectPath(path)).toBe(path)
    },
  )

  it.each([
    '//evil.com',
    'https://evil.com',
    'evil.com',
    '',
    undefined,
    null,
    { from: '/home' },
  ])('falls back to home for an unsafe redirect', (from) => {
    expect(resolveRedirectPath(from)).toBe('/home')
  })
})
