import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

import type { User } from '../lib/types'
import { Brand } from './Brand'

interface AppHeaderProps {
  user: User
  via: string | null
  onAdd: () => void
  onLogout: () => void
}

// O menu da conta nao existe no design, mas sair precisa de um lugar.
export function AppHeader({ user, via, onAdd, onLogout }: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // `pointerdown` e nao `click`: fecha antes do clique completar, entao um
  // clique no botao que abriu nao reabre em seguida.
  useEffect(() => {
    if (!menuOpen) return

    const close = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', onEscape)
    }
  }, [menuOpen])

  return (
    <header className="dn-header">
      <div className="dn-header__inner">
        <div className="dn-header__left">
          <Link to="/notas">
            <Brand size="sm" />
          </Link>

          <div className="dn-header__divider" />

          <nav className="dn-nav">
            <NavLink to="/notas" className={({ isActive }) => (isActive ? 'is-active' : '')}>
              Minhas notas
            </NavLink>
            <NavLink to="/arquivadas" className={({ isActive }) => (isActive ? 'is-active' : '')}>
              Arquivadas
            </NavLink>
          </nav>
        </div>

        <div className="dn-header__right">
          <Link className="dn-btn dn-btn--mono" to={`/${user.username}`}>
            /{user.username}
          </Link>

          <button type="button" className="dn-btn dn-btn--primary" onClick={onAdd}>
            <span className="dn-btn__plus">+</span> Adicionar nota
          </button>

          <div className="dn-menu" ref={menuRef}>
            <button
              type="button"
              className="dn-menu__button"
              aria-label="Menu da conta"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="dn-avatar">{user.initials}</span>
            </button>

            {menuOpen ? (
              <div className="dn-menu__panel">
                <span className="dn-menu__label">
                  {user.email}
                  {via ? (
                    <>
                      <br />
                      sessao via {via}
                    </>
                  ) : null}
                </span>
                <Link className="dn-menu__item" to={`/${user.username}`}>
                  Ver meu perfil
                </Link>
                <button type="button" className="dn-menu__item" onClick={onLogout}>
                  Sair
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
