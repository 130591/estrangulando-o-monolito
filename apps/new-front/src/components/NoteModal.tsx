import { useEffect, useState, type FormEvent } from 'react'

import { tagOptionStyle, visibilityLabel } from '../lib/format'
import type { Note, NotePayload, Tag, Visibility } from '../lib/types'

interface NoteModalProps {
  /** null = criar. */
  note: Note | null
  tags: Tag[]
  saving: boolean
  error: string | null
  onSave: (payload: NotePayload) => void
  onClose: () => void
  onArchive: () => void
  onDelete: () => void
}

interface FormState {
  url: string
  title: string
  note: string
  tag: string
  newTag: string
  visibility: Visibility
}

function initialForm(note: Note | null): FormState {
  return {
    url: note?.url ?? '',
    title: note?.title ?? '',
    note: note?.note ?? '',
    tag: note?.tag?.name ?? '',
    newTag: '',
    visibility: note?.visibility ?? 'public',
  }
}

// Usado para criar E para editar: o que muda e o titulo, o texto do botao e
// as acoes destrutivas no rodape.
export function NoteModal({
  note,
  tags,
  saving,
  error,
  onSave,
  onClose,
  onArchive,
  onDelete,
}: NoteModalProps) {
  // Copia: editar direto na nota deixaria o card da grade mudando enquanto
  // se digita, e Cancelar nao teria o que desfazer.
  const [form, setForm] = useState<FormState>(() => initialForm(note))
  const isEdit = note !== null

  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeydown)
    return () => document.removeEventListener('keydown', onKeydown)
  }, [onClose])

  const patch = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  // A tag nova tem prioridade no submit: as duas preenchem o mesmo campo.
  const selectTag = (name: string) =>
    setForm((current) => ({ ...current, tag: name, newTag: '' }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (saving) return

    onSave({
      url: form.url,
      title: form.title,
      note: form.note,
      tag: form.newTag.trim() || form.tag || '',
      visibility: form.visibility,
    })
  }

  return (
    <div className="dn-overlay" onClick={onClose}>
      <div className="dn-modal" onClick={(event) => event.stopPropagation()}>
        <div className="dn-modal__head">
          <span className="dn-modal__title">{isEdit ? 'Editar nota' : 'Adicionar nota'}</span>
          <button type="button" className="dn-modal__close" aria-label="Fechar" onClick={onClose}>
            &#10005;
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="dn-modal__body">
            {error ? <p className="dn-form-error">{error}</p> : null}

            <div className="dn-field">
              <label className="dn-field__label" htmlFor="dn-url">
                URL
              </label>
              <input
                id="dn-url"
                className="dn-field__control dn-field__control--mono"
                type="text"
                placeholder="https://"
                value={form.url}
                onChange={(event) => patch('url', event.target.value)}
              />
            </div>

            <div className="dn-field">
              <label className="dn-field__label" htmlFor="dn-title">
                TÍTULO
              </label>
              <input
                id="dn-title"
                className="dn-field__control"
                type="text"
                placeholder="Como você quer lembrar disso"
                value={form.title}
                onChange={(event) => patch('title', event.target.value)}
              />
            </div>

            <div className="dn-field">
              <span className="dn-field__label">TAG</span>
              <div className="dn-tagpicker">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className="dn-tagopt"
                    style={tagOptionStyle(tag, form.tag === tag.name && !form.newTag)}
                    onClick={() => selectTag(tag.name)}
                  >
                    {tag.name}
                  </button>
                ))}

                <input
                  className="dn-newtag"
                  type="text"
                  placeholder="+ nova tag"
                  aria-label="Nova tag"
                  value={form.newTag}
                  onChange={(event) => patch('newTag', event.target.value)}
                />
              </div>
            </div>

            <div className="dn-field">
              <label className="dn-field__label" htmlFor="dn-note">
                ANOTAÇÃO <span>(opcional)</span>
              </label>
              <textarea
                id="dn-note"
                className="dn-field__control"
                rows={3}
                placeholder="Por que isso importa pra você?"
                value={form.note}
                onChange={(event) => patch('note', event.target.value)}
              />
            </div>
          </div>

          <div className="dn-modal__foot">
            <div className="dn-modal__actions">
              <button
                type="button"
                className="dn-vis"
                onClick={() =>
                  patch('visibility', form.visibility === 'public' ? 'private' : 'public')
                }
              >
                <span
                  className={`dn-vis__dot${form.visibility === 'public' ? ' is-public' : ''}`}
                />
                {visibilityLabel(form.visibility)}
              </button>

              {isEdit ? (
                <>
                  <button type="button" className="dn-btn dn-btn--mono" onClick={onArchive}>
                    {note.archived ? 'Desarquivar' : 'Arquivar'}
                  </button>
                  <button type="button" className="dn-btn dn-btn--mono" onClick={onDelete}>
                    Excluir
                  </button>
                </>
              ) : null}
            </div>

            <div className="dn-modal__actions">
              <button type="button" className="dn-btn dn-btn--quiet" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="dn-btn dn-btn--primary" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar nota'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
