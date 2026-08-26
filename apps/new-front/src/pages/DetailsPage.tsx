import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { apiFetch } from '../lib/http'
import type { ExampleItem, ItemResponse } from '../lib/http'

export function DetailsPage() {
  const { id } = useParams<{ id: string }>()
  const [item, setItem] = useState<ExampleItem>()
  const [source, setSource] = useState<string>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    setError(undefined)

    apiFetch<ItemResponse>(`/items/${id}`)
      .then((res) => {
        if (!active) return
        setItem(res.data.item)
        setSource(res.data.source)
      })
      .catch((err: Error) => active && setError(err.message))

    return () => {
      active = false
    }
  }, [id])

  return (
    <>
      <h1>Item {id}</h1>

      {/* Deep link aqui so funciona porque o servidor devolve index.html. */}
      <p>
        Atendido por: <code>{source ?? '...'}</code>
      </p>

      {error ? <p className="error">{error}</p> : null}
      {item ? (
        <dl>
          <dt>id</dt>
          <dd>
            <code>{item.id}</code>
          </dd>
          <dt>name</dt>
          <dd>{item.name}</dd>
        </dl>
      ) : null}

      <Link to="/">Voltar</Link>
    </>
  )
}
