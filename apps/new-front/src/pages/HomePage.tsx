import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { apiFetch } from '../lib/http'
import type { ExampleItem, ItemsResponse, StatusResponse } from '../lib/http'

export function HomePage() {
  const [items, setItems] = useState<ExampleItem[]>([])
  const [source, setSource] = useState<string>()
  const [runtime, setRuntime] = useState<string>()
  const [requestId, setRequestId] = useState<string | null>(null)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true

    Promise.all([apiFetch<ItemsResponse>('/items'), apiFetch<StatusResponse>('/status')])
      .then(([itemsRes, statusRes]) => {
        if (!active) return
        setItems(itemsRes.data.items)
        setSource(itemsRes.data.source)
        setRequestId(itemsRes.requestId)
        setRuntime(statusRes.data.runtime)
      })
      .catch((err: Error) => active && setError(err.message))

    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <h1>Novo mundo</h1>

      <p>
        Os dados vem do mesmo path que o legado chama; quem responde depende do
        URL map da borda.
      </p>

      <dl>
        <dt>Atendido por</dt>
        <dd>
          <code>{source ?? '...'}</code>
        </dd>
        <dt>Runtime do backend</dt>
        <dd>
          <code>{runtime ?? '...'}</code>
        </dd>
        <dt>x-request-id</dt>
        <dd>
          <code>{requestId ?? '...'}</code>
        </dd>
      </dl>

      {error ? <p className="error">{error}</p> : null}

      <ul className="items">
        {items.map((item) => (
          <li key={item.id}>
            <Link to={`/details/${item.id}`}>{item.name}</Link>
          </li>
        ))}
      </ul>
    </>
  )
}
