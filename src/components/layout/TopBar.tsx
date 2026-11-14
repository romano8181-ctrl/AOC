import { Clock, MapPin, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

// PRD 12.2 TopBar. Airport, simulated time and Reset are static placeholders
// until the store exists: they get wired to real data in T-10.
export function TopBar() {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-6 backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-md bg-sec-overview/15 px-2 py-1 font-mono text-sm font-medium tracking-wider text-sec-overview">
          <MapPin className="size-3.5" aria-hidden />
          AUR
        </span>
        <span className="hidden text-sm text-muted-foreground md:inline">
          Aurora International <span className="text-muted-foreground/70">(simulated)</span>
        </span>
      </div>

      <div className="mx-auto flex items-center gap-2 rounded-full border border-brand-via/30 bg-brand-via/10 px-3 py-1 font-mono tabular-nums">
        <Clock className="size-3.5 text-brand-via" aria-hidden />
        <span className="text-sm text-muted-foreground">18 Nov 2026</span>
        <span className="text-base font-semibold text-foreground">12:00</span>
        <span className="rounded bg-brand-via/20 px-1 text-[10px] font-semibold text-brand-via">SIM</span>
      </div>

      <span className="flex items-center gap-2 rounded-full bg-status-warn px-3 py-1 text-xs font-semibold tracking-wide text-[#3a2600]">
        <span className="relative flex size-2" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#3a2600]/40" />
          <span className="relative inline-flex size-2 rounded-full bg-[#3a2600]" />
        </span>
        SIMULATION MODE
      </span>

      <Button
        variant="outline"
        size="sm"
        className="border-sec-simulator/40 text-sec-simulator hover:bg-sec-simulator/15 hover:text-sec-simulator"
        onClick={() => toast.info('Reset demo data will be available once the data store is ready.')}
      >
        <RotateCcw aria-hidden />
        Reset demo data
      </Button>
    </header>
  )
}
