export function resolveRedirectPath(from: unknown): string {
  if (
    typeof from === 'string' &&
    from.startsWith('/') &&
    !from.startsWith('//')
  ) {
    return from
  }

  return '/home'
}
