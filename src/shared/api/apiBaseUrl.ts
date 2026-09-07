const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

if (!rawApiBaseUrl) {
  throw new Error('VITE_API_BASE_URL is required')
}

const apiBaseUrl = rawApiBaseUrl.replace(/\/+$/, '')

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${apiBaseUrl}/api${normalizedPath}`
}
