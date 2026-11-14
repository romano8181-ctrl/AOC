import { ArrowRight, Clock, PlaneLanding, PlaneTakeoff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FlightStatusPill } from '@/components/flights/FlightStatusPill'
import { FlightTime } from '@/components/flights/FlightTime'
import { GateLabel } from '@/components/flights/GateLabel'
import { getAirline } from '@/data/reference'
import { isInConflict } from '@/domain/gateRules'
import { useConflicts, useUpcomingFlights } from '@/store/selectors'

// FR-009: flights in the next 2 hours (by estimated time), max 10.
export function UpcomingFlights() {
  const flights = useUpcomingFlights()
  const conflicts = useConflicts()

  return (
    <section className="rounded-xl border bg-card/80" aria-labelledby="upcoming-title">
      <div className="flex items-center justify-between gap-3 border-b px-5 py-3">
        <h2 id="upcoming-title" className="flex items-center gap-2 font-semibold">
          <Clock className="size-4 text-sec-overview" aria-hidden />
          Next 2 hours
          <span className="rounded-full bg-sec-overview/15 px-2 text-xs font-medium text-sec-overview">{flights.length}</span>
        </h2>
        <Link to="/flights" className="flex items-center gap-1 text-sm text-primary hover:underline">
          View all flights <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      {flights.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">No flights in the next 2 hours.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Flights in the next two hours</caption>
            <thead>
              <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-2 font-medium">Time</th>
                <th className="px-3 py-2 font-medium">Flight</th>
                <th className="px-3 py-2 font-medium">Route</th>
                <th className="px-3 py-2 font-medium">Gate</th>
                <th className="px-5 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {flights.map((f) => {
                const TypeIcon = f.type === 'ARRIVAL' ? PlaneLanding : PlaneTakeoff
                return (
                  <tr key={f.id} className="border-t border-border/60 transition-colors hover:bg-accent/40">
                    <td className="px-5 py-2.5">
                      <FlightTime flight={f} />
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-mono font-medium">{f.flightNumber}</p>
                      <p className="text-xs text-muted-foreground">{getAirline(f.airlineCode)?.name}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-2">
                        <TypeIcon
                          className={f.type === 'ARRIVAL' ? 'size-4 text-sec-overview' : 'size-4 text-sec-flights'}
                          aria-label={f.type === 'ARRIVAL' ? 'Arrival' : 'Departure'}
                        />
                        {f.type === 'ARRIVAL' ? f.origin : f.destination}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <GateLabel gateId={f.gateId} inConflict={isInConflict(f.id, conflicts)} />
                    </td>
                    <td className="px-5 py-2.5">
                      <FlightStatusPill flight={f} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
