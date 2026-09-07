import { Link } from 'react-router-dom'

import { Brand } from '../components/Brand'

export function NotFoundPage() {
  return (
    <div className="dn-auth dn-mesh">
      <Link to="/">
        <Brand />
      </Link>

      <div className="dn-empty" style={{ maxWidth: 400 }}>
        <strong>404</strong>
        <span>Essa rota nao existe dentro do dev notes.</span>
      </div>

      <Link className="dn-btn dn-btn--ghost" to="/">
        Voltar para o inicio
      </Link>
    </div>
  )
}
