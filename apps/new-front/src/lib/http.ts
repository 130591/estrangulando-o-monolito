const REQUEST_ID_HEADER = 'x-request-id'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/example'

export interface ApiResponse<T> {
  data: T
  requestId: string | null
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  const requestId = crypto.randomUUID()

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      [REQUEST_ID_HEADER]: requestId,
      ...init.headers,
    },
  })

  if (!response.ok) {
    throw new ApiError(response.status, `${response.status} em ${path}`)
  }

  return {
    data: (await response.json()) as T,
    requestId: response.headers.get(REQUEST_ID_HEADER),
  }
}

export interface ExampleItem {
  id: string
  name: string
  description?: string
}

// `source` diz qual backend atendeu.
export interface Envelope {
  source: string
  requestId: string
}

export type ItemsResponse = Envelope & { items: ExampleItem[] }
export type ItemResponse = Envelope & { item: ExampleItem }
export type StatusResponse = Envelope & { runtime: string; migrated: boolean }
