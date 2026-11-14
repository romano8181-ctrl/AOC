import { CheckCircle2, ClipboardList, PlaneLanding, PlaneTakeoff } from 'lucide-react'
import type { ReactNode } from 'react'
import { FlightTime } from '@/components/flights/FlightTime'
import { GateLabel } from '@/components/flights/GateLabel'
import type { GateRequiredItem } from '@/domain/gateRules'
import type { Flight } from '@/domain/types'
import { cn } from '@/lib/utils'

interface GateRequiredListProps {
  items: GateRequiredItem[]
  /** Renders the action for a row (assign / reassign button, T-14). */
  renderAction?: (flight: Flight, problem: GateRequiredItem['problem']) => ReactNode
}

// FR-027: active flights without a gate or in a gate conflict.
export function GateRequiredList({ items, renderAction }: GateRequiredListProps) {
  return (
    <section className="rounded-xl border bg-card/80" aria-labelledby="gate-required-title">
      <div className="flex items-center gap-2 border-b px-5 py-3">
        <ClipboardList className="size-4 text-status-warn" aria-hidden />
        <h2 id="gate-required-title" className="font-semibold">
          Gate required
        </h2>
        <span
          className={cn(
            'rounded-full px-2 text-xs font-medium',
            items.length > 0 ? 'bg-status-warn/15 text-status-warn' : 'bg-status-ok/15 text-status-ok',
          )}
        >
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="flex items-center gap-3 px-5 py-5 text-sm">
          <CheckCircle2 className="size-5 text-status-ok" aria-hidden />
          Every active flight has a conflict-free gate.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map(({ flight, problem }) => {
            const TypeIcon = flight.type === 'ARRIVAL' ? PlaneLanding : PlaneTakeoff
            return (
              <li key={flight.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 text-sm">
                <span
                  className={cn(
                    'w-20 rounded px-1.5 py-0.5 text-center text-[11px] font-semibold tracking-wide uppercase',
                    problem === 'CONFLICT' ? 'bg-status-critical/15 text-status-critical' : 'bg-status-warn/15 text-status-warn',
                  )}
                >
                  {problem === 'CONFLICT' ? 'Conflict' : 'No gate'}
                </span>
                <span className="flex w-24 items-center gap-2 font-mono font-medium">
                  <TypeIcon className="size-4 text-muted-foreground" aria-label={flight.type === 'ARRIVAL' ? 'Arrival' : 'Departure'} />
                  {flight.flightNumber}
                </span>
                <FlightTime flight={flight} className="w-28" />
                <span className="flex-1 text-muted-foreground">
                  {flight.type === 'ARRIVAL' ? `from ${flight.origin}` : `to ${flight.destination}`}
                </span>
                <GateLabel gateId={flight.gateId} inConflict={problem === 'CONFLICT'} />
                {renderAction?.(flight, problem)}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
