import { NavLink } from 'react-router-dom'
import { Info, Plane } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from './navItems'

// PRD 12.2: 240px sidebar; collapses to icons below 1280px (PRD 12.5).
export function Sidebar() {
  return (
    <aside
      aria-label="Main navigation"
      className="sticky top-0 flex h-screen w-16 shrink-0 flex-col border-r bg-card/70 backdrop-blur xl:w-60"
    >
      <div className="flex h-14 items-center gap-3 border-b px-3 xl:px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-from via-brand-via to-brand-to shadow-lg shadow-brand-via/25">
          <Plane className="size-5 -rotate-45 text-white" aria-hidden />
        </div>
        <div className="hidden leading-tight xl:block">
          <p className="bg-gradient-to-r from-brand-from to-brand-to bg-clip-text text-sm font-semibold tracking-wide text-transparent">
            AOC
          </p>
          <p className="text-xs text-muted-foreground">Airport Operations Center</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon, tone }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={label}
            className={({ isActive }) =>
              cn(
                'group relative flex h-11 items-center justify-center gap-3 rounded-lg px-2 text-sm font-medium transition-colors xl:justify-start',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                isActive
                  ? cn(tone.activeBg, 'text-foreground')
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className={cn('absolute top-2 bottom-2 left-0 w-1 rounded-full', tone.solid)} aria-hidden />
                )}
                <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-md', tone.tint)}>
                  <Icon className={cn('size-[18px]', tone.text)} aria-hidden />
                </span>
                <span className="hidden xl:inline">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="m-2 rounded-lg border border-status-warn/25 bg-status-warn/10 p-3 text-xs text-status-warn">
        <div className="flex items-start justify-center gap-2 xl:justify-start" title="Educational simulation">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="hidden text-foreground/80 xl:block">
            Educational simulation — not a certified aviation system.
          </p>
        </div>
      </div>
    </aside>
  )
}
