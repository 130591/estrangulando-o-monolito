import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useAuth } from '../auth/auth-context'
import { Brand } from '../components/Brand'
import { profiles } from '../lib/api'
import { dateLabel, monthLabel, tagStyle } from '../lib/format'
import { ApiError } from '../lib/http'
import type { ProfileResponse } from '../lib/types'

export function ProfilePage() {
  const { username = '' } = useParams<{ username: string }>()
  const { user } = useAuth()

  const [data, setData] = useState<ProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setNotFound(false)

    profiles
      .byUsername(username, controller.signal)
      .then(setData)
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        setNotFound(cause instanceof ApiError && cause.status === 404)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [username])

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  // Sob a borda este front vive em /new/: o link copiado tem que incluir o
  // prefixo para abrir de fato.
  const profileUrl = new URL(
    `${import.meta.env.BASE_URL}${username}`.replace(/\/{2,}/g, '/'),
    window.location.origin,
  ).toString()

  const copyLink = async () => {
    try {
      // Só existe em contexto seguro (https ou localhost).
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
    } catch {
      // Sem clipboard o botao nao pisca, mas nada quebra.
    }
  }

  return (
    <div className="dn-profile">
      <div className="dn-profile__bar">
        <div className="dn-profile__bar-inner">
          <Link to="/">
            <Brand size="xs" />
          </Link>

          <Link className="dn-btn dn-btn--ghost" to={user ? '/notas' : '/entrar'}>
            {user ? 'Minhas notas' : 'Criar meu perfil'}
          </Link>
        </div>
      </div>

      <main className="dn-profile__main">
        {loading ? (
          <div>
            <div className="dn-skeleton dn-skeleton--row" />
            <div className="dn-skeleton dn-skeleton--row" />
            <div className="dn-skeleton dn-skeleton--row" />
          </div>
        ) : null}

        {!loading && notFound ? (
          <div className="dn-empty">
            <strong>/{username} não existe</strong>
            <span>Nenhum perfil publicou nesse endereço.</span>
          </div>
        ) : null}

        {!loading && data ? (
          <>
            <div className="dn-profile__head">
              <span className="dn-avatar dn-avatar--lg">{data.profile.initials}</span>

              <div className="dn-profile__id">
                <h1 className="dn-profile__name">{data.profile.name}</h1>
                <p className="dn-profile__handle">{profileUrl.replace(/^https?:\/\//, '')}</p>
                {data.profile.bio ? <p className="dn-profile__bio">{data.profile.bio}</p> : null}
              </div>

              <button
                type="button"
                className={`dn-copy${copied ? ' is-copied' : ''}`}
                onClick={copyLink}
              >
                {copied ? '✓ Link copiado' : 'Copiar link'}
              </button>
            </div>

            {/* "desde" e nao "seguidores": nao existe follow neste app. */}
            <div className="dn-stats">
              <span>
                <strong>{data.stats.publicNotes}</strong>{' '}
                {data.stats.publicNotes === 1 ? 'nota pública' : 'notas públicas'}
              </span>
              <span>
                <strong>{data.stats.tags}</strong> {data.stats.tags === 1 ? 'tag' : 'tags'}
              </span>
              <span>
                desde <strong>{monthLabel(data.stats.memberSince)}</strong>
              </span>
            </div>

            {data.notes.length > 0 ? (
              <div className="dn-list">
                {data.notes.map((note) => (
                  <a
                    key={note.id}
                    className="dn-list__row"
                    // Sem href o <a> nao navega: nota sem url nao vira link vazio.
                    href={note.url ?? undefined}
                    target={note.url ? '_blank' : undefined}
                    rel="noopener noreferrer"
                  >
                    <span className="dn-mark dn-mark--solid">{note.mark}</span>

                    <div className="dn-list__body">
                      <div className="dn-list__title">{note.title}</div>
                      {note.note ? <div className="dn-list__note">{note.note}</div> : null}
                    </div>

                    {note.tag ? (
                      <span className="dn-tag" style={tagStyle(note.tag)}>
                        {note.tag.name}
                      </span>
                    ) : null}
                    <span className="dn-list__date">{dateLabel(note.createdAt)}</span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="dn-empty">
                <strong>Nada público ainda</strong>
                <span>{data.profile.name} ainda não publicou nenhuma nota.</span>
              </div>
            )}

            <p className="dn-profile__footer">feito com dev notes — sem IA, só links bons</p>
          </>
        ) : null}
      </main>
    </div>
  )
}
