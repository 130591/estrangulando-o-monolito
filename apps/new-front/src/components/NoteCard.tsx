import { dateLabel, tagStyle, visibilityLabel } from '../lib/format'
import type { Note } from '../lib/types'

interface NoteCardProps {
  note: Note
  onSelect: (note: Note) => void
}

// So apresenta: quem decide o que abrir e a pagina. <button> e nao <div>
// para ser focavel pelo teclado.
export function NoteCard({ note, onSelect }: NoteCardProps) {
  return (
    <button type="button" className="dn-card" onClick={() => onSelect(note)}>
      <div className="dn-card__top">
        <div className="dn-card__ident">
          <span className="dn-mark dn-mark--solid">{note.mark}</span>
          <span className="dn-domain">{note.domain}</span>
        </div>
        <span className="dn-card__vis">{visibilityLabel(note.visibility)}</span>
      </div>

      <div className="dn-card__body">
        <h3 className="dn-card__title">{note.title}</h3>
        {note.note ? <p className="dn-card__note">{note.note}</p> : null}
      </div>

      <div className="dn-card__foot">
        {note.tag ? (
          <span className="dn-tag" style={tagStyle(note.tag)}>
            {note.tag.name}
          </span>
        ) : (
          <span />
        )}
        <span className="dn-card__date">{dateLabel(note.createdAt)}</span>
      </div>
    </button>
  )
}
