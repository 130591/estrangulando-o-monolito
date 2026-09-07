import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/auth-context'
import { Brand } from '../components/Brand'
import { profiles } from '../lib/api'
import type { Note } from '../lib/types'

// Conta de verdade: a vitrine busca as notas publicas dela pela mesma rota
// que a pagina de perfil usa.
const SHOWCASE_USERNAME = 'mariana'

export function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [preview, setPreview] = useState<Note[]>([])

  useEffect(() => {
    const controller = new AbortController()

    profiles
      .byUsername(SHOWCASE_USERNAME, controller.signal)
      .then((body) => setPreview(body.notes.slice(0, 3)))
      .catch(() => setPreview([]))

    return () => controller.abort()
  }, [])

  // O e-mail atravessa para o cadastro em vez de ser perdido.
  const start = (event: FormEvent) => {
    event.preventDefault()
    const query = email ? `?email=${encodeURIComponent(email)}&modo=criar` : ''
    navigate(`/entrar${query}`)
  }

  return (
    <div className="dn-landing dn-mesh">
      <header className="dn-landing__header">
        <Link to="/">
          <Brand />
        </Link>

        <div className="dn-landing__nav">
          <a href="#docs">Docs</a>
          <a href="#changelog">Changelog</a>
          <Link className="dn-btn dn-btn--ghost" to={user ? '/notas' : '/entrar'}>
            {user ? 'Minhas notas' : 'Entrar'}
          </Link>
        </div>
      </header>

      <main className="dn-hero">
        <div className="dn-badge">
          <span className="dn-badge__dot" />
          v0.1 — sem IA, sem mágica
        </div>

        <h1 className="dn-hero__title">
          A read-later list
          <br />
          <span>que você realmente lê.</span>
        </h1>

        <p className="dn-hero__lead">
          Salve artigos, vídeos e docs. Organize por tags. Publique sua lista de estudos em um
          perfil que dá vontade de compartilhar.
        </p>

        <form className="dn-hero__cta" onSubmit={start}>
          <div className="dn-hero__row">
            <input
              className="dn-input dn-input--mono"
              type="email"
              placeholder="voce@email.com"
              aria-label="Seu e-mail"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button type="submit" className="dn-btn dn-btn--primary">
              Começar
            </button>
          </div>
          <span className="dn-hero__hint">e-mail e senha · sem cartão · sem IA</span>
        </form>

        {preview.length > 0 ? (
          <div className="dn-preview">
            <div className="dn-preview__bar">
              <span className="dn-preview__dot" />
              <span className="dn-preview__dot" />
              <span className="dn-preview__dot" />
              <span className="dn-preview__url">devnotes.app/{SHOWCASE_USERNAME}</span>
            </div>

            <div className="dn-preview__grid">
              {preview.map((note) => (
                <div className="dn-preview__card" key={note.id}>
                  <div className="dn-preview__meta">
                    <span className="dn-mark">{note.mark}</span>
                    <span className="dn-domain">{note.domain}</span>
                  </div>
                  <div className="dn-preview__title">{note.title}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
