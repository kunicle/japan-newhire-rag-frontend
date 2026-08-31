import { beforeEach, describe, expect, it } from 'vitest'
import { readCsrfToken } from './csrf'

function clearCookies() {
  for (const name of ['XSRF-TOKEN', 'other', 'MY-XSRF-TOKEN']) {
    document.cookie = `${name}=; Max-Age=0; Path=/`
  }
}

describe('readCsrfToken', () => {
  beforeEach(clearCookies)

  it('reads the XSRF token', () => {
    document.cookie = 'XSRF-TOKEN=csrf-token; Path=/'
    expect(readCsrfToken()).toBe('csrf-token')
  })

  it('selects only the exact cookie among multiple cookies', () => {
    document.cookie = 'other=other-value; Path=/'
    document.cookie = 'MY-XSRF-TOKEN=wrong-value; Path=/'
    document.cookie = 'XSRF-TOKEN=right-value; Path=/'
    expect(readCsrfToken()).toBe('right-value')
  })

  it('returns null when the cookie is absent', () => {
    expect(readCsrfToken()).toBeNull()
  })

  it('decodes a URL-encoded token', () => {
    document.cookie = `XSRF-TOKEN=${encodeURIComponent('token+/= value')}; Path=/`
    expect(readCsrfToken()).toBe('token+/= value')
  })
})
