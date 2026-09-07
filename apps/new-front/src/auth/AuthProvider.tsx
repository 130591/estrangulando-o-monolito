import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { auth, type Credentials, type Registration } from '../lib/api'
import { ApiError, writeToken, readToken } from '../lib/http'
import type { SessionResponse, User } from '../lib/types'
import { AuthContext, type AuthState } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [via, setVia] = useState<string | null>(null)
  const [loading, setLoading] = useState(() => readToken() !== null)

  // Se o token guardado nao valer, limpa: melhor cair no login do que
  // quebrar o dashboard inteiro em 401.
  useEffect(() => {
    if (readToken() === null) return

    const controller = new AbortController()

    auth
      .me(controller.signal)
      .then((body) => {
        setUser(body.user)
        setVia(body.via ?? null)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        if (error instanceof ApiError && error.status === 401) writeToken(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [])

  const accept = useCallback((body: SessionResponse) => {
    writeToken(body.token)
    setUser(body.user)
    setVia(null)
    return body.user
  }, [])

  const login = useCallback(
    (credentials: Credentials) => auth.login(credentials).then(accept),
    [accept],
  )

  const register = useCallback(
    (payload: Registration) => auth.register(payload).then(accept),
    [accept],
  )

  const logout = useCallback(() => {
    writeToken(null)
    setUser(null)
    setVia(null)
  }, [])

  const value = useMemo<AuthState>(
    () => ({ user, via, loading, login, register, logout }),
    [user, via, loading, login, register, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
