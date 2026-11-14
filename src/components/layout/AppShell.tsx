import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ErrorBoundary } from './ErrorBoundary'
import { NAV_ITEMS } from './navItems'
import { Sidebar } from './Sidebar'
import { StorageWarningToast } from './StorageWarningToast'
import { TopBar } from './TopBar'

function PageFallback() {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground" role="status">
      Loading…
    </div>
  )
}

// PRD 12.2: Sidebar + TopBar + routed page content. Errors are contained per page (PRD 12.4).
export function AppShell() {
  const { pathname } = useLocation()

  useEffect(() => {
    const page = NAV_ITEMS.find((item) => item.to === pathname)?.label ?? 'Overview'
    document.title = `${page} · AOC (simulation)`
  }, [pathname])

  return (
    <div className="flex min-h-screen">
      <StorageWarningToast />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="mx-auto w-full max-w-[1600px] flex-1 p-6">
          <ErrorBoundary resetKey={pathname}>
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
