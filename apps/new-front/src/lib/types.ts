// Identico ao que os dois backends devolvem. Se divergir, o front quebra no
// dia em que a borda desviar a rota.

export type Visibility = 'public' | 'private'

export interface Tag {
  id: string
  name: string
  hue: number
}

export interface Note {
  id: string
  url: string | null
  domain: string
  mark: string
  title: string
  note: string | null
  tag: Tag | null
  visibility: Visibility
  archived: boolean
  createdAt: string | null
}

export interface User {
  id: string
  email?: string
  username: string
  name: string
  bio: string | null
  initials: string
  createdAt: string | null
}

export interface NoteStats {
  total: number
  publicCount: number
  archived: number
}

export interface ProfileStats {
  publicNotes: number
  tags: number
  memberSince: string | null
}

// `source` diz qual backend atendeu.
export interface Envelope {
  source: string
  requestId: string
}

export type SessionResponse = Envelope & { token: string; user: User }
export type MeResponse = Envelope & { user: User; via: string }
export type NotesResponse = Envelope & { notes: Note[]; stats: NoteStats }
export type NoteResponse = Envelope & { note: Note }
export type TagsResponse = Envelope & { tags: Tag[] }
export type TagResponse = Envelope & { tag: Tag }
export type ProfileResponse = Envelope & {
  profile: User
  stats: ProfileStats
  isOwner: boolean
  notes: Note[]
}

export interface NotePayload {
  url?: string
  title?: string
  note?: string
  tag?: string
  visibility?: Visibility
  archived?: boolean
}
