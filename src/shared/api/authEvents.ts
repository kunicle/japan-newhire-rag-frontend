const authExpiredListeners = new Set<() => void>()

export function onAuthExpired(listener: () => void): () => void {
  authExpiredListeners.add(listener)
  return () => authExpiredListeners.delete(listener)
}

export function emitAuthExpired(): void {
  authExpiredListeners.forEach((listener) => listener())
}
