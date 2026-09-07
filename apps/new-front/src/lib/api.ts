import { apiFetch } from './http'
import type {
  MeResponse,
  NoteResponse,
  NotePayload,
  NotesResponse,
  ProfileResponse,
  SessionResponse,
  TagResponse,
  TagsResponse,
} from './types'

// O transporte (token, correlation id, envelope) fica em http.ts.

export interface Credentials {
  email: string
  password: string
}

export interface Registration extends Credentials {
  name: string
  username: string
  bio?: string
}

export const auth = {
  login: (credentials: Credentials) =>
    apiFetch<SessionResponse>('/auth/login', { method: 'POST', body: credentials }),

  register: (payload: Registration) =>
    apiFetch<SessionResponse>('/auth/register', { method: 'POST', body: payload }),

  me: (signal?: AbortSignal) => apiFetch<MeResponse>('/auth/me', { signal }),
}

export interface NoteFilters {
  query?: string
  tag?: string
  archived?: boolean
}

export const notes = {
  // Devolve a lista filtrada E os contadores do acervo inteiro, para o
  // cabecalho nao mudar com o filtro.
  list: (filters: NoteFilters, signal?: AbortSignal) =>
    apiFetch<NotesResponse>('/notes', {
      signal,
      query: {
        q: filters.query || undefined,
        tag: filters.tag && filters.tag !== TODOS ? filters.tag : undefined,
        archived: filters.archived ? '1' : undefined,
      },
    }),

  create: (payload: NotePayload) =>
    apiFetch<NoteResponse>('/notes', { method: 'POST', body: payload }),

  update: (id: string, patch: NotePayload) =>
    apiFetch<NoteResponse>(`/notes/${id}`, { method: 'PATCH', body: patch }),

  remove: (id: string) => apiFetch<void>(`/notes/${id}`, { method: 'DELETE' }),
}

export const tags = {
  list: (signal?: AbortSignal) => apiFetch<TagsResponse>('/tags', { signal }),
  create: (name: string) => apiFetch<TagResponse>('/tags', { method: 'POST', body: { name } }),
}

export const profiles = {
  // Publica: o token, quando existe, so diz ao backend se quem olha e o dono.
  byUsername: (username: string, signal?: AbortSignal) =>
    apiFetch<ProfileResponse>(`/profiles/${encodeURIComponent(username)}`, { signal }),
}

// "Tudo" nao e uma tag: e a ausencia de filtro.
export const TODOS = 'Tudo'
