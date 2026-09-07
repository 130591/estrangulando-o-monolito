import { createContext, use } from 'react'

import type { Credentials, Registration } from '../lib/api'
import type { User } from '../lib/types'

export interface AuthState {
  user: User | null
  /** De qual backend veio o token em uso. Muda sozinho quando a borda desvia. */
  via: string | null
  loading: boolean
  login: (credentials: Credentials) => Promise<User>
  register: (payload: Registration) => Promise<User>
  logout: () => void
}

// Sem valor padrao: usar o hook fora do provider tem que estourar, nao
// devolver um usuario nulo silencioso.
export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const state = use(AuthContext)
  if (!state) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return state
}
