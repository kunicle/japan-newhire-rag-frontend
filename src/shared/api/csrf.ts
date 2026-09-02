const CSRF_COOKIE_NAME = 'XSRF-TOKEN'

export function readCsrfToken(): string | null {
  const prefix = `${CSRF_COOKIE_NAME}=`
  const cookie = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(prefix))

  if (!cookie) return null

  const encodedValue = cookie.slice(prefix.length)
  if (!encodedValue) return null

  try {
    return decodeURIComponent(encodedValue)
  } catch {
    throw new Error('XSRF-TOKEN cookie contains an invalid encoded value')
  }
}
