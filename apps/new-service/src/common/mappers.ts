import { initialsFrom } from './link'
import type { ApiNote, ApiTag, ApiUser, NoteRow, TagRow, UserRow } from './types'

export function isoDate(value: string | Date | null): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  return `${String(value).replace(' ', 'T')}Z`
}

// BIGINT chega como number: acima de 2^53 o JSON perderia precisao, entao o
// contrato publico dos ids e string.
export function toId(value: number | string | null): string | null {
  return value === null || value === undefined ? null : String(value)
}

export function toUser(row: UserRow): ApiUser {
  return {
    id: String(row.id),
    email: row.email,
    username: row.username,
    name: row.name,
    bio: row.bio ?? null,
    initials: initialsFrom(row.name),
    createdAt: isoDate(row.created_at),
  }
}

export function toPublicUser(row: UserRow): ApiUser {
  const { email: _email, ...rest } = toUser(row)
  void _email
  return rest
}

export function toTag(row: TagRow): ApiTag {
  return { id: String(row.id), name: row.name, hue: Number(row.hue) }
}

export function toNote(row: NoteRow): ApiNote {
  return {
    id: String(row.id),
    url: row.url ?? null,
    domain: row.domain,
    mark: row.mark,
    title: row.title,
    note: row.note ?? null,
    tag:
      row.tag_id !== null && row.tag_id !== undefined
        ? { id: String(row.tag_id), name: row.tag_name ?? '', hue: Number(row.tag_hue ?? 250) }
        : null,
    visibility: row.visibility,
    archived: Boolean(row.archived_at),
    createdAt: isoDate(row.created_at),
  }
}
