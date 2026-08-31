const CSRF_COOKIE_NAME = 'XSRF-TOKEN'

export function readCsrfToken(): string | null {
  try {
    const prefix = `${CSRF_COOKIE_NAME}=`
    const cookie = document.cookie
      .split(';')
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith(prefix))

    if (!cookie) return null

    const value = cookie.slice(prefix.length)
    return value ? decodeURIComponent(value) : null
  } catch {
    return null
  }
}
