import { createBrowserRouter } from 'react-router-dom'

import { App } from './App'
import { DetailsPage } from './pages/DetailsPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'

// BASE_URL vem do `base` do Vite, entao o basename acompanha o prefixo de
// publicacao. React Router quer sem barra final.
const basename = import.meta.env.BASE_URL.replace(/\/+$/, '') || '/'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'details/:id', element: <DetailsPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename },
)
