import { describe, expect, it } from 'vitest'
import { resolveRedirectPath } from './redirect'

describe('resolveRedirectPath', () => {
  it.each(['/hr/documents/upload', '/rag?foo=bar'])(
    'preserves internal path %s',
    (path) => {
      expect(resolveRedirectPath(path, ['HR_MANAGER'])).toBe(path)
    },
  )

  it.each([
    ['/manager/education/340', ['EMPLOYEE']],
    ['/hr/courses/1', ['EMPLOYEE']],
    ['/admin/users', ['HR_MANAGER']],
    ['/hr/documents/processing', ['SYSTEM_ADMIN']],
  ] as const)(
    'falls back to home when roles cannot access %s',
    (path, roles) => {
      expect(resolveRedirectPath(path, [...roles])).toBe('/home')
    },
  )

  it.each([
    ['/manager/education/340', ['MANAGER']],
    ['/hr/courses/1', ['HR_MANAGER']],
    ['/admin/users', ['SYSTEM_ADMIN']],
    ['/hr/documents/1', ['SYSTEM_ADMIN']],
  ] as const)(
    'preserves %s when the user has an allowed role',
    (path, roles) => {
      expect(resolveRedirectPath(path, [...roles])).toBe(path)
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
    expect(resolveRedirectPath(from, ['EMPLOYEE'])).toBe('/home')
  })

  it.each(['/login', '/access-denied'])(
    'does not restore terminal route %s after login',
    (path) => {
      expect(resolveRedirectPath(path, ['EMPLOYEE'])).toBe('/home')
    },
  )
})
