import { Search, X } from 'lucide-react'
import { StatusPill } from '@/components/StatusPill'
import { getStatusLabel } from '@/components/statusStyles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AIRLINES } from '@/data/reference'
import { SEARCH_MAX_LENGTH, hasActiveFilters, type FlightQuery } from '@/domain/flightQuery'
import { STATUS_ORDER } from '@/domain/kpi'
import type { FlightStatus } from '@/domain/types'
import { cn } from '@/lib/utils'

interface FlightFiltersProps {
  query: FlightQuery
  onChange: (next: FlightQuery) => void
  onClear: () => void
}

const TYPE_OPTIONS: { value: FlightQuery['type']; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ARRIVAL', label: 'Arrivals' },
  { value: 'DEPARTURE', label: 'Departures' },
]

// FR-012, FR-013, FR-015: search + status chips + airline + type + "Delayed ≥ 15 min" + clear.
export function FlightFilters({ query, onChange, onClear }: FlightFiltersProps) {
  const set = (patch: Partial<FlightQuery>) => onChange({ ...query, ...patch })
  const toggleStatus = (status: FlightStatus) =>
    set({
      statuses: query.statuses.includes(status)
        ? query.statuses.filter((s) => s !== status)
        : [...query.statuses, status],
    })

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card/80 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query.search}
            maxLength={SEARCH_MAX_LENGTH}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Search flight number or city…"
            aria-label="Search flights"
            className="pl-9"
          />
        </div>

        <Select value={query.airline} onValueChange={(airline) => set({ airline })}>
          <SelectTrigger className="w-48" aria-label="Filter by airline">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All airlines</SelectItem>
            {AIRLINES.map((a) => (
              <SelectItem key={a.code} value={a.code}>
                <span className="size-2 rounded-full" style={{ backgroundColor: a.color }} aria-hidden />
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div role="radiogroup" aria-label="Flight type" className="flex rounded-lg border bg-background/60 p-0.5">
          {TYPE_OPTIONS.map((opt) => {
            const active = query.type === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => set({ type: opt.value })}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  active ? 'bg-sec-flights/20 text-sec-flights' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Switch
            id="delayed-only"
            checked={query.delayedOnly}
            onCheckedChange={(delayedOnly) => set({ delayedOnly })}
            className="data-[state=checked]:bg-status-warn"
          />
          <label htmlFor="delayed-only" className="cursor-pointer">
            Delayed ≥ 15 min
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs tracking-wide text-muted-foreground uppercase">Status</span>
        {STATUS_ORDER.map((status) => {
          const active = query.statuses.includes(status)
          return (
            <button
              key={status}
              type="button"
              aria-pressed={active}
              aria-label={`Status ${getStatusLabel(status)}`}
              onClick={() => toggleStatus(status)}
              className={cn(
                'rounded-full transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                query.statuses.length > 0 && !active && 'opacity-40 hover:opacity-80',
                active && 'ring-2 ring-foreground/40',
              )}
            >
              <StatusPill status={status} />
            </button>
          )
        })}
        {hasActiveFilters(query) && (
          <Button variant="ghost" size="sm" onClick={onClear} className="ml-auto text-muted-foreground">
            <X aria-hidden />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}
