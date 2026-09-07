const REQUEST_ID_HEADER = 'x-request-id'

// A MESMA chave do front legado. Servidos pela borda os dois estao na mesma
// origem, entao a sessao atravessa o corte.
const TOKEN_KEY = 'devnotes.token'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// localStorage pode lancar (aba anonima, storage bloqueado): sem o try/catch
// o app morreria no boot por uma preferencia do navegador.
export function readToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function writeToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Sessao so em memoria: some no refresh, mas o app funciona.
  }
}

// Qual backend atendeu a ultima chamada: a prova visivel do desvio de rota.
let lastSource: string | null = null

export function getLastSource(): string | null {
  return lastSource
}

interface RequestOptions {
  method?: string
  body?: unknown
  query?: Record<string, string | undefined>
  signal?: AbortSignal
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal } = options

  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value) url.searchParams.set(key, value)
  }

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    // Amarra o log do browser ao do backend que atender.
    [REQUEST_ID_HEADER]: crypto.randomUUID(),
  }

  const token = readToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'sem_conexao', 'servidor fora do ar')
  }

  if (response.status === 204) return undefined as T

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const detail = (payload ?? {}) as { error?: string; message?: string }
    throw new ApiError(
      response.status,
      detail.error ?? 'erro_desconhecido',
      detail.message ?? defaultMessage(response.status),
    )
  }

  const envelope = payload as { source?: string }
  if (envelope?.source) lastSource = envelope.source

  return payload as T
}

function defaultMessage(status: number): string {
  if (status === 401) return 'sessao expirada'
  if (status === 404) return 'nao encontrado'
  return `algo deu errado (${status})`
}
