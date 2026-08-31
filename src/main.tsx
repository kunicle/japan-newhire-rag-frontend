import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './app/router'
import { TemporaryRoleProvider } from './app/TemporaryRoleContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TemporaryRoleProvider>
      <RouterProvider router={router} />
    </TemporaryRoleProvider>
  </StrictMode>,
)
