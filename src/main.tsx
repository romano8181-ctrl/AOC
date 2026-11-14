import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Toaster } from '@/components/ui/sonner'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Toaster first: it must subscribe before App's effects can raise a toast on start-up. */}
    <Toaster />
    <App />
  </StrictMode>,
)
