import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { useAuth } from '../auth/auth-context'
import { Brand } from '../components/Brand'
import { ApiError } from '../lib/http'

interface LocationState {
  from?: string
}

export function AuthPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register } = useAuth()

  // "criar" chega da landing quando a pessoa digitou o e-mail la.
  const [mode, setMode] = useState<'login' | 'register'>(
    params.get('modo') === 'criar' ? 'register' : 'login',
  )
  const [form, setForm] = useState({
    email: params.get('email') ?? '',
    password: '',
    name: '',
    username: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isRegister = mode === 'register'
  const patch = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return

    setSaving(true)
    setError(null)

    try {
      if (isRegister) {
        await register({
          email: form.email,
          password: form.password,
          name: form.name,
          username: form.username,
        })
      } else {
        await login({ email: form.email, password: form.password })
      }

      // Volta para onde a guarda interrompeu, ou para o dashboard.
      const from = (location.state as LocationState | null)?.from
      navigate(from ?? '/notas', { replace: true })
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'algo deu errado')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dn-auth dn-mesh">
      <Link to="/">
        <Brand />
      </Link>

      <form className="dn-auth__card" onSubmit={submit} noValidate>
        <div>
          <h1 className="dn-auth__title">{isRegister ? 'Criar conta' : 'Entrar'}</h1>
          <p className="dn-auth__lead">
            {isRegister
              ? 'Sua lista de estudos, com um perfil público no fim.'
              : 'Bem-vindo de volta. Suas notas estão onde você deixou.'}
          </p>
        </div>

        {error ? <p className="dn-form-error">{error}</p> : null}

        <div className="dn-field">
          <label className="dn-field__label" htmlFor="dn-email">
            E-MAIL
          </label>
          <input
            id="dn-email"
            className="dn-field__control dn-field__control--mono"
            type="email"
            autoComplete="email"
            placeholder="voce@email.com"
            value={form.email}
            onChange={(event) => patch('email', event.target.value)}
          />
        </div>

        {isRegister ? (
          <>
            <div className="dn-field">
              <label className="dn-field__label" htmlFor="dn-name">
                NOME
              </label>
              <input
                id="dn-name"
                className="dn-field__control"
                type="text"
                autoComplete="name"
                placeholder="Mariana Souza"
                value={form.name}
                onChange={(event) => patch('name', event.target.value)}
              />
            </div>

            <div className="dn-field">
              <label className="dn-field__label" htmlFor="dn-username">
                USERNAME <span>(vira devnotes.app/seu-nome)</span>
              </label>
              <input
                id="dn-username"
                className="dn-field__control dn-field__control--mono"
                type="text"
                autoCapitalize="none"
                autoComplete="username"
                placeholder="mariana"
                value={form.username}
                onChange={(event) => patch('username', event.target.value)}
              />
            </div>
          </>
        ) : null}

        <div className="dn-field">
          <label className="dn-field__label" htmlFor="dn-password">
            SENHA {isRegister ? <span>(mínimo 8)</span> : null}
          </label>
          <input
            id="dn-password"
            className="dn-field__control"
            type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            placeholder="••••••••"
            value={form.password}
            onChange={(event) => patch('password', event.target.value)}
          />
        </div>

        <button type="submit" className="dn-btn dn-btn--primary dn-btn--block" disabled={saving}>
          {saving ? 'Entrando...' : isRegister ? 'Criar conta' : 'Entrar'}
        </button>

        <p className="dn-auth__switch">
          {isRegister ? 'já tem conta?' : 'ainda não tem conta?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(isRegister ? 'login' : 'register')
              setError(null)
            }}
          >
            {isRegister ? 'entrar' : 'criar uma'}
          </button>
        </p>

        {isRegister ? null : (
          <p className="dn-auth__seed">
            conta de demonstração
            <br />
            <strong>mariana@devnotes.app</strong> · <strong>devnotes</strong>
          </p>
        )}
      </form>
    </div>
  )
}
