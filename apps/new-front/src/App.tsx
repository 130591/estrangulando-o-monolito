import { Link, Outlet } from 'react-router-dom'

export function App() {
  return (
    <>
      <header className="topbar">
        <strong>new-front</strong>
        <span className="badge">React 19</span>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/details/1">Details</Link>
          {/* Absoluto: sai do basename e volta para o legado. */}
          <a href="/">Legado</a>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </>
  )
}
