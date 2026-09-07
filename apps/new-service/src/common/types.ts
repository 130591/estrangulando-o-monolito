// Linha do banco (snake_case) e contrato publico (camelCase) ficam separados:
// o schema e compartilhado com o legado e nao muda de nome de coluna para
// agradar este servico, e o contrato HTTP tem que ser identico ao do outro
// lado - senao o front quebra quando a borda desvia a rota.

export type Visibility = 'public' | 'private'

export interface UserRow {
  id: number
  email: string
  username: string
  name: string
  bio: string | null
  password_hash: string
  created_at: string
  updated_at: string
}

export interface TagRow {
  id: number
  user_id: number
  name: string
  hue: number
  created_at: string
}

// tag_name/tag_hue vem do LEFT JOIN, nao da tabela notes.
export interface NoteRow {
  id: number
  user_id: number
  tag_id: number | null
  url: string | null
  domain: string
  mark: string
  title: string
  note: string | null
  visibility: Visibility
  archived_at: string | null
  created_at: string
  updated_at: string
  tag_name?: string | null
  tag_hue?: number | null
}

export interface ApiTag {
  id: string
  name: string
  hue: number
}

export interface ApiUser {
  id: string
  email?: string
  username: string
  name: string
  bio: string | null
  initials: string
  createdAt: string | null
}

export interface ApiNote {
  id: string
  url: string | null
  domain: string
  mark: string
  title: string
  note: string | null
  tag: ApiTag | null
  visibility: Visibility
  archived: boolean
  createdAt: string | null
}

export interface NoteStats {
  total: number
  publicCount: number
  archived: number
}

export interface AuthenticatedUser {
  id: string
  email: string
  username: string
  name: string
  via: string
}
