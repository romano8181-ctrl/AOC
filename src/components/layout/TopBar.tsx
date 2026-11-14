import { Clock, MapPin } from 'lucide-react'
import { AIRPORT } from '@/data/reference'
import { SIM_DATE, formatSimDate, toHHMM } from '@/domain/time'
import { useSimNow } from '@/store/selectors'
import { ResetDemoButton } from './ResetDemoButton'

// PRD 12.2 TopBar: airport, simulated date/time, simulation badge, reset.
export function TopBar() {
  const simNow = useSimNow()

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-6 backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-md bg-sec-overview/15 px-2 py-1 font-mono text-sm font-medium tracking-wider text-sec-overview">
          <MapPin className="size-3.5" aria-hidden />
          {AIRPORT.code}
        </span>
        <span className="hidden text-sm text-muted-foreground md:inline">{AIRPORT.name}</span>
      </div>

      <div
        className="mx-auto flex items-center gap-2 rounded-full border border-brand-via/30 bg-brand-via/10 px-3 py-1 font-mono tabular-nums"
        aria-label={`Simulated time ${formatSimDate(SIM_DATE)} ${toHHMM(simNow)}`}
      >
        <Clock className="size-3.5 text-brand-via" aria-hidden />
        <span className="text-sm text-muted-foreground">{formatSimDate(SIM_DATE)}</span>
        <span className="text-base font-semibold text-foreground">{toHHMM(simNow)}</span>
        <span className="rounded bg-brand-via/20 px-1 text-[10px] font-semibold text-brand-via">SIM</span>
      </div>

      <span className="flex items-center gap-2 rounded-full bg-status-warn px-3 py-1 text-xs font-semibold tracking-wide text-[#3a2600]">
        <span className="relative flex size-2" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#3a2600]/40" />
          <span className="relative inline-flex size-2 rounded-full bg-[#3a2600]" />
        </span>
        SIMULATION MODE
      </span>

      <ResetDemoButton />
    </header>
  )
}
