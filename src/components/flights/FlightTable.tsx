import { ArrowDown, ArrowUp, ArrowUpDown, PlaneLanding, PlaneTakeoff, SearchX } from 'lucide-react'
import { FlightStatusPill } from '@/components/flights/FlightStatusPill'
import { GateLabel } from '@/components/flights/GateLabel'
import { Button } from '@/components/ui/button'
import { getAirline } from '@/data/reference'
import type { SortDirection, SortField } from '@/domain/flightQuery'
import { isInConflict, type GateConflict } from '@/domain/gateRules'
import { toHHMM } from '@/domain/time'
import type { Flight } from '@/domain/types'
import { cn } from '@/lib/utils'

interface FlightTableProps {
  flights: Flight[]
  conflicts: GateConflict[]
  sortBy: SortField
  sortDir: SortDirection
  onSort: (field: SortField) => void
  onClearFilters: () => void
  /** Opens flight details (T-12). */
  onSelect?: (flight: Flight) => void
}

function SortHeader({ field, label, sortBy, sortDir, onSort }: {
  field: SortField
  label: string
  sortBy: SortField
  sortDir: SortDirection
  onSort: (field: SortField) => void
}) {
  const active = sortBy === field
  const Icon = !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown
  return (
    <th className="px-3 py-2.5 font-medium" aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn('inline-flex items-center gap-1 uppercase hover:text-foreground', active && 'text-sec-flights')}
      >
        {label}
        <Icon className="size-3.5" aria-hidden />
      </button>
    </th>
  )
}

// FR-011, FR-014, FR-016, FR-018.
export function FlightTable({ flights, conflicts, sortBy, sortDir, onSort, onClearFilters, onSelect }: FlightTableProps) {
  if (flights.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card/80 px-6 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-sec-flights/15">
          <SearchX className="size-6 text-sec-flights" aria-hidden />
        </span>
        <p className="font-medium">No flights match your filters</p>
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          Clear filters
        </Button>
      </div>
    )
  }

  const sortProps = { sortBy, sortDir, onSort }
  return (
    <div className="overflow-x-auto rounded-xl border bg-card/80">
      <table className="w-full text-sm">
        <caption className="sr-only">Flights of the simulated day</caption>
        <thead className="bg-card">
          <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
            <th className="px-4 py-2.5 font-medium">Flight</th>
            <th className="px-3 py-2.5 font-medium">Type</th>
            <th className="px-3 py-2.5 font-medium">From → To</th>
            <SortHeader field="scheduled" label="Sched" {...sortProps} />
            <SortHeader field="estimated" label="Est" {...sortProps} />
            <th className="px-3 py-2.5 font-medium">Actual</th>
            <th className="px-3 py-2.5 font-medium">Gate</th>
            <th className="px-3 py-2.5 font-medium">Aircraft</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {flights.map((f) => {
            const airline = getAirline(f.airlineCode)
            const TypeIcon = f.type === 'ARRIVAL' ? PlaneLanding : PlaneTakeoff
            return (
              <tr
                key={f.id}
                tabIndex={onSelect ? 0 : undefined}
                onClick={onSelect ? () => onSelect(f) : undefined}
                onKeyDown={(e) => {
                  if (!onSelect || (e.key !== 'Enter' && e.key !== ' ')) return
                  e.preventDefault()
                  onSelect(f)
                }}
                className={cn(
                  'border-t border-border/60 transition-colors',
                  onSelect && 'cursor-pointer hover:bg-accent/40 focus-visible:bg-accent/50 focus-visible:outline-none',
                  f.status === 'CANCELLED' && 'text-muted-foreground',
                )}
              >
                <td className="px-4 py-2.5">
                  <p className="flex items-center gap-2 font-mono font-medium">
                    <span className="size-2 rounded-full" style={{ backgroundColor: airline?.color }} aria-hidden />
                    {f.flightNumber}
                  </p>
                  <p className="pl-4 text-xs text-muted-foreground">{airline?.name}</p>
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium',
                      f.type === 'ARRIVAL' ? 'bg-sec-overview/15 text-sec-overview' : 'bg-sec-flights/15 text-sec-flights',
                    )}
                  >
                    <TypeIcon className="size-3.5" aria-hidden />
                    {f.type === 'ARRIVAL' ? 'ARR' : 'DEP'}
                  </span>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {f.origin} <span className="text-muted-foreground">→</span> {f.destination}
                </td>
                <td className="px-3 py-2.5 font-mono tabular-nums">{toHHMM(f.scheduledTime)}</td>
                <td
                  className={cn(
                    'px-3 py-2.5 font-mono tabular-nums',
                    f.estimatedTime !== f.scheduledTime && f.status !== 'CANCELLED' && 'font-medium text-status-warn',
                  )}
                >
                  {f.status === 'CANCELLED' ? '—' : toHHMM(f.estimatedTime)}
                </td>
                <td className="px-3 py-2.5 font-mono tabular-nums text-muted-foreground">
                  {f.actualTime === null ? '—' : toHHMM(f.actualTime)}
                </td>
                <td className="px-3 py-2.5">
                  <GateLabel gateId={f.gateId} inConflict={isInConflict(f.id, conflicts)} muted={f.status === 'CANCELLED'} />
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{f.aircraftTypeCode}</td>
                <td className="px-4 py-2.5">
                  <FlightStatusPill flight={f} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
