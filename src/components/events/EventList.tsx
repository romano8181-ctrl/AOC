import { History } from 'lucide-react'
import { toHHMM } from '@/domain/time'
import type { EventType, OperationalEvent } from '@/domain/types'
import { cn } from '@/lib/utils'

// FR-035: event log rows. Reused on Overview (recent events) and in the Simulator (full log).

const TYPE_STYLE: Record<EventType, { label: string; className: string }> = {
  FLIGHT_DELAYED: { label: 'Delay', className: 'bg-status-warn/15 text-status-warn' },
  FLIGHT_CANCELLED: { label: 'Cancel', className: 'bg-status-critical/15 text-status-critical' },
  STATUS_CHANGED: { label: 'Status', className: 'bg-status-boarding/15 text-status-boarding' },
  GATE_ASSIGNED: { label: 'Gate', className: 'bg-sec-gates/15 text-sec-gates' },
  GATE_REASSIGNED: { label: 'Gate', className: 'bg-sec-gates/15 text-sec-gates' },
  GATE_CLOSED: { label: 'Closure', className: 'bg-status-critical/15 text-status-critical' },
  GATE_REOPENED: { label: 'Reopen', className: 'bg-status-ok/15 text-status-ok' },
  DEMO_RESET: { label: 'Reset', className: 'bg-sec-overview/15 text-sec-overview' },
}

interface EventListProps {
  events: OperationalEvent[]
  emptyText?: string
}

export function EventList({ events, emptyText = 'No events yet. Trigger a scenario in the Simulator.' }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="flex items-center gap-3 px-5 py-6 text-sm text-muted-foreground">
        <History className="size-5" aria-hidden />
        <span>{emptyText}</span>
      </div>
    )
  }
  return (
    <ol className="divide-y divide-border/60">
      {events.map((e) => {
        const style = TYPE_STYLE[e.type]
        return (
          <li key={e.id} className="flex items-start gap-3 px-5 py-2.5 text-sm">
            <span className="w-11 shrink-0 pt-0.5 font-mono text-xs text-muted-foreground tabular-nums">{toHHMM(e.simTime)}</span>
            <span className={cn('w-16 shrink-0 rounded px-1.5 py-0.5 text-center text-[11px] font-semibold', style.className)}>
              {style.label}
            </span>
            <span className="flex-1">{e.message}</span>
          </li>
        )
      })}
    </ol>
  )
}
