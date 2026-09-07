import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/auth-context'
import { AppHeader } from '../components/AppHeader'
import { NoteCard } from '../components/NoteCard'
import { NoteModal } from '../components/NoteModal'
import { notes as notesApi, tags as tagsApi, TODOS } from '../lib/api'
import { countLabel } from '../lib/format'
import { ApiError } from '../lib/http'
import type { Note, NotePayload, NoteStats, Tag } from '../lib/types'

interface DashboardPageProps {
  archived?: boolean
}

function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

interface ModalState {
  note: Note | null | undefined
  saving: boolean
  error: string | null
}

const CLOSED: ModalState = { note: undefined, saving: false, error: null }

export function DashboardPage({ archived = false }: DashboardPageProps) {
  const navigate = useNavigate()
  const { user, via, logout } = useAuth()

  const [list, setList] = useState<Note[]>([])
  const [stats, setStats] = useState<NoteStats | null>(null)
  const [tagList, setTagList] = useState<Tag[]>([])
  const [filter, setFilter] = useState(TODOS)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>(CLOSED)
  const [revision, setRevision] = useState(0)

  const debouncedQuery = useDebounced(query)

  const reloadTags = useCallback(
    (signal?: AbortSignal) =>
      tagsApi
        .list(signal)
        .then((body) => setTagList(body.tags))
        .catch(() => undefined),
    [],
  )

  useEffect(() => {
    const controller = new AbortController()
    void reloadTags(controller.signal)
    return () => controller.abort()
  }, [reloadTags, revision])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)

    notesApi
      .list({ query: debouncedQuery, tag: filter, archived }, controller.signal)
      .then((body) => {
        setList(body.notes)
        setStats(body.stats)
        setError(null)
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        setError(cause instanceof ApiError ? cause.message : 'algo deu errado')
        setList([])
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [debouncedQuery, filter, archived, revision])

  // Recarrega em vez de mexer na lista na mao: filtro, busca e contadores
  // mudam junto, e reconciliar tudo aqui daria divergencia.
  const refresh = () => setRevision((value) => value + 1)

  const save = async (payload: NotePayload) => {
    const current = modal.note
    setModal((state) => ({ ...state, saving: true, error: null }))

    try {
      if (current) await notesApi.update(current.id, payload)
      else await notesApi.create(payload)

      setModal(CLOSED)
      refresh()
    } catch (cause) {
      setModal((state) => ({
        ...state,
        saving: false,
        error: cause instanceof ApiError ? cause.message : 'algo deu errado',
      }))
    }
  }

  const toggleArchive = async () => {
    const current = modal.note
    if (!current) return

    try {
      await notesApi.update(current.id, { archived: !current.archived })
      setModal(CLOSED)
      refresh()
    } catch (cause) {
      setModal((state) => ({
        ...state,
        error: cause instanceof ApiError ? cause.message : 'algo deu errado',
      }))
    }
  }

  const remove = async () => {
    const current = modal.note
    if (!current) return
    if (!window.confirm(`Excluir "${current.title}"? Isso não tem volta.`)) return

    try {
      await notesApi.remove(current.id)
      setModal(CLOSED)
      refresh()
    } catch (cause) {
      setModal((state) => ({
        ...state,
        error: cause instanceof ApiError ? cause.message : 'algo deu errado',
      }))
    }
  }

  if (!user) return null

  const filters = [TODOS, ...tagList.map((tag) => tag.name)]
  const filtering = Boolean(query) || filter !== TODOS

  return (
    <div>
      <AppHeader
        user={user}
        via={via}
        onAdd={() => setModal({ note: null, saving: false, error: null })}
        onLogout={() => {
          logout()
          navigate('/')
        }}
      />

      <main className="dn-main">
        <div className="dn-page-head">
          <div>
            <h1 className="dn-page-head__title">{archived ? 'Arquivadas' : 'Minhas notas'}</h1>
            <p className="dn-page-head__count">{countLabel(stats)}</p>
          </div>

          <div className="dn-search">
            <span className="dn-search__slash">/</span>
            <input
              className="dn-search__input"
              type="search"
              placeholder="Buscar por título ou tag"
              aria-label="Buscar notas"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        <div className="dn-filters">
          {filters.map((name) => (
            <button
              key={name}
              type="button"
              className={`dn-filter${filter === name ? ' is-active' : ''}`}
              onClick={() => setFilter(name)}
            >
              {name}
            </button>
          ))}
        </div>

        {error ? <p className="dn-note-error">{error}</p> : null}

        {loading && list.length === 0 ? (
          <div className="dn-grid">
            <div className="dn-skeleton" />
            <div className="dn-skeleton" />
            <div className="dn-skeleton" />
          </div>
        ) : null}

        {list.length > 0 ? (
          <div className="dn-grid">
            {list.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onSelect={(selected) => setModal({ note: selected, saving: false, error: null })}
              />
            ))}
          </div>
        ) : null}

        {!loading && list.length === 0 && !error ? (
          <div className="dn-empty">
            {archived ? (
              <>
                <strong>Nada arquivado</strong>
                <span>Notas arquivadas somem do dashboard sem serem apagadas.</span>
              </>
            ) : filtering ? (
              <>
                <strong>Nenhuma nota com esse filtro</strong>
                <span>Tente outra busca ou volte para “Tudo”.</span>
              </>
            ) : (
              <>
                <strong>Sua lista começa aqui</strong>
                <span>Cole um link em “Adicionar nota” e diga por que ele importa.</span>
              </>
            )}
          </div>
        ) : null}
      </main>

      {modal.note !== undefined ? (
        <NoteModal
          note={modal.note}
          tags={tagList}
          saving={modal.saving}
          error={modal.error}
          onSave={save}
          onClose={() => setModal(CLOSED)}
          onArchive={toggleArchive}
          onDelete={remove}
        />
      ) : null}
    </div>
  )
}
