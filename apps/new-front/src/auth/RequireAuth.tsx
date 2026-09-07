import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { readToken } from '../lib/http'
import { useAuth } from './auth-context'

// Espera o /auth/me do boot antes de decidir: sem isso um F5 no dashboard
// jogaria para o login antes de saber se ha sessao.
export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="dn-main"><div className="dn-skeleton dn-skeleton--row" /></div>

  // readToken() alem de `user`: cobre o instante entre o login e o commit do
  // estado.
  if (!user && readToken() === null) {
    return <Navigate to="/entrar" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
