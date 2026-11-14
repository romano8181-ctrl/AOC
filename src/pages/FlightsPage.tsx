import { useMemo, useState } from 'react'
import { FlightDetailsSheet } from '@/components/flights/FlightDetailsSheet'
import { FlightFilters } from '@/components/flights/FlightFilters'
import { FlightTable } from '@/components/flights/FlightTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { DEFAULT_QUERY, queryFlights, type FlightQuery, type SortField } from '@/domain/flightQuery'
import { useConflicts, useFlights } from '@/store/selectors'

// PRD 12.3 Flights. Filters live in local component state; a row click opens the details sheet.
export function FlightsPage() {
  const flights = useFlights()
  const conflicts = useConflicts()
  const [query, setQuery] = useState<FlightQuery>(DEFAULT_QUERY)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const visible = useMemo(() => queryFlights(flights, query), [flights, query])

  const clearFilters = () => setQuery((q) => ({ ...DEFAULT_QUERY, sortBy: q.sortBy, sortDir: q.sortDir }))
  const toggleSort = (field: SortField) =>
    setQuery((q) =>
      q.sortBy === field ? { ...q, sortDir: q.sortDir === 'asc' ? 'desc' : 'asc' } : { ...q, sortBy: field, sortDir: 'asc' },
    )

  return (
    <>
      <PageHeader
        section="flights"
        title="Flights"
        description="Arrivals and departures for the simulated day."
        actions={
          <span className="rounded-full bg-sec-flights/15 px-3 py-1 text-sm font-medium text-sec-flights" aria-live="polite">
            Showing {visible.length} of {flights.length}
          </span>
        }
      />
      <div className="flex flex-col gap-4">
        <FlightFilters query={query} onChange={setQuery} onClear={clearFilters} />
        <FlightTable
          flights={visible}
          conflicts={conflicts}
          sortBy={query.sortBy}
          sortDir={query.sortDir}
          onSort={toggleSort}
          onClearFilters={clearFilters}
          onSelect={(f) => setSelectedId(f.id)}
        />
      </div>
      <FlightDetailsSheet flightId={selectedId} onClose={() => setSelectedId(null)} />
    </>
  )
}
