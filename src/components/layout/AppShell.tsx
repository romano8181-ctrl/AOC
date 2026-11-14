import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { StorageWarningToast } from './StorageWarningToast'
import { TopBar } from './TopBar'

// PRD 12.2: Sidebar + TopBar + routed page content.
export function AppShell() {
  return (
    <div className="flex min-h-screen">
      <StorageWarningToast />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="mx-auto w-full max-w-[1600px] flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
