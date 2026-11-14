import { Ban, Maximize2, TriangleAlert } from 'lucide-react'
import { StatusPill } from '@/components/StatusPill'
import { formatWindow, getWindow, type GateSummary } from '@/domain/gateRules'
import type { Flight, GateState } from '@/domain/types'
import { cn } from '@/lib/utils'

// Literal classes per state so Tailwind generates them.
const STATE_STYLE: Record<GateState, { bar: string; code: string }> = {
  AVAILABLE: { bar: 'bg-status-ok', code: 'text-status-ok' },
  RESERVED: { bar: 'bg-status-warn', code: 'text-status-warn' },
  OCCUPIED: { bar: 'bg-status-info', code: 'text-status-info' },
  UNAVAILABLE: { bar: 'bg-status-neutral', code: 'text-status-neutral' },
}

function FlightLine({ label, flight }: { label: string; flight: Flight | undefined }) {
  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <span className="pt-px text-muted-foreground">{label}</span>
      {flight ? (
        <span className="flex flex-col items-end leading-tight">
          <span className="font-mono font-medium text-foreground">{flight.flightNumber}</span>
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{formatWindow(getWindow(flight))}</span>
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
    </div>
  )
}

interface GateCardProps {
  summary: GateSummary
  onOpen: (gateId: string) => void
}

// FR-021: code, state (color + text + icon), current flight, next flight, flights today.
export function GateCard({ summary, onOpen }: GateCardProps) {
  const { gate, state, hasConflict, current, next, flightsToday } = summary
  const style = STATE_STYLE[state]
  const closed = state === 'UNAVAILABLE'

  return (
    <button
      type="button"
      onClick={() => onOpen(gate.id)}
      aria-label={`Gate ${gate.id}, ${state.toLowerCase()}${hasConflict ? ', conflict' : ''}`}
      className={cn(
        'group relative flex flex-col gap-3 overflow-hidden rounded-xl border bg-card/80 p-4 pt-5 text-left transition-colors',
        'hover:border-sec-gates/50 hover:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        hasConflict && 'border-status-critical/60 ring-1 ring-status-critical/40',
        closed && 'bg-[repeating-linear-gradient(135deg,transparent,transparent_8px,rgb(159_176_212/0.05)_8px,rgb(159_176_212/0.05)_16px)]',
      )}
    >
      <span className={cn('absolute inset-x-0 top-0 h-1', hasConflict ? 'bg-status-critical' : style.bar)} aria-hidden />
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={cn('font-mono text-2xl leading-none font-semibold', hasConflict ? 'text-status-critical' : style.code)}>
            {gate.id}
          </p>
          <p className="mt-1 flex items-center gap-1 text-[11px] tracking-wide text-muted-foreground uppercase">
            {gate.sizeCategory === 'WIDE' && <Maximize2 className="size-3" aria-hidden />}
            {gate.sizeCategory === 'WIDE' ? 'Wide-body' : 'Narrow-body'}
          </p>
        </div>
        <Maximize2 className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <StatusPill status={state} />
        {hasConflict && <StatusPill status="CONFLICT" />}
      </div>

      {closed ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Ban className="size-3.5" aria-hidden />
          {gate.closedReason ?? 'Closed'}
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          <FlightLine label="Now" flight={current} />
          <FlightLine label="Next" flight={next} />
        </div>
      )}

      <p className="flex items-center justify-between border-t border-border/60 pt-2 text-xs text-muted-foreground">
        <span>
          {flightsToday === 0 ? 'No assignments today' : `${flightsToday} flight${flightsToday === 1 ? '' : 's'} today`}
        </span>
        {hasConflict && <TriangleAlert className="size-3.5 text-status-critical" aria-hidden />}
      </p>
    </button>
  )
}
