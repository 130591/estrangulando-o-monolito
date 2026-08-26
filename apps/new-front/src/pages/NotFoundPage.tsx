import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <>
      <h1>404</h1>
      <p>Rota desconhecida dentro do new-front.</p>
      <Link to="/">Voltar</Link>
    </>
  )
}
