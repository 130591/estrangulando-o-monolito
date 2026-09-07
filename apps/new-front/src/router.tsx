import { createBrowserRouter, Outlet } from 'react-router-dom'

import { AuthProvider } from './auth/AuthProvider'
import { RequireAuth } from './auth/RequireAuth'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { LandingPage } from './pages/LandingPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProfilePage } from './pages/ProfilePage'

// BASE_URL vem do `base` do Vite, entao o basename acompanha o prefixo de
// publicacao. React Router quer sem barra final.
const basename = import.meta.env.BASE_URL.replace(/\/+$/, '') || '/'

export const router = createBrowserRouter(
  [
    {
      // Toda rota precisa saber se ha sessao: ate a landing troca "Entrar"
      // por "Minhas notas".
      element: (
        <AuthProvider>
          <Outlet />
        </AuthProvider>
      ),
      children: [
        { index: true, element: <LandingPage /> },
        { path: 'entrar', element: <AuthPage /> },
        {
          element: <RequireAuth />,
          children: [
            { path: 'notas', element: <DashboardPage /> },
            { path: 'arquivadas', element: <DashboardPage archived /> },
          ],
        },
        // O React Router ranqueia segmento estatico acima de dinamico:
        // /notas nunca cai aqui.
        { path: ':username', element: <ProfilePage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename },
)
