import { lazy } from 'react'
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { FlightsPage } from '@/pages/FlightsPage'
import { GatesPage } from '@/pages/GatesPage'
import { OverviewPage } from '@/pages/OverviewPage'
import { SimulatorPage } from '@/pages/SimulatorPage'

// Analytics pulls in Recharts (~half the bundle): load it only when the page is opened.
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })))

// Routes from PRD section 11. Unknown paths go back to Overview.
const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <OverviewPage /> },
      { path: '/flights', element: <FlightsPage /> },
      { path: '/gates', element: <GatesPage /> },
      { path: '/analytics', element: <AnalyticsPage /> },
      { path: '/simulator', element: <SimulatorPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
