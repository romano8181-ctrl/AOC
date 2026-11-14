import { PlaneLanding, PlaneTakeoff, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { EventList } from '@/components/events/EventList'
import { FlightStatusPill } from '@/components/flights/FlightStatusPill'
import { GateLabel } from '@/components/flights/GateLabel'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { getAircraftType, getAirline } from '@/data/reference'
import { getDelayMinutes } from '@/domain/flightRules'
import { formatWindow, getWindow } from '@/domain/gateRules'
import { toHHMM } from '@/domain/time'
import { useConflicts, useFlight, useFlightEvents, useFlights } from '@/store/selectors'
import { FlightActions } from './FlightActions'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

interface FlightDetailsSheetProps {
  flightId: string | null
  onClose: () => void
}

// FR-016, FR-017, US-004: all fields, gate window + conflict, allowed actions, history.
// Reads the flight live from the store, so the sheet updates right after an action.
export function FlightDetailsSheet({ flightId, onClose }: FlightDetailsSheetProps) {
  const flight = useFlight(flightId)
  const flights = useFlights()
  const conflicts = useConflicts()
  const history = useFlightEvents(flightId)

  const conflict = flight ? conflicts.find((c) => c.flightIds.includes(flight.id)) : undefined
  const partner = conflict ? flights.find((f) => f.id === conflict.flightIds.find((id) => id !== flight!.id)) : undefined
  const delay = flight && flight.status !== 'CANCELLED' ? getDelayMinutes(flight) : 0
  const airline = flight ? getAirline(flight.airlineCode) : undefined
  const TypeIcon = flight?.type === 'ARRIVAL' ? PlaneLanding : PlaneTakeoff

  return (
    <Sheet open={flight !== undefined} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-[480px]">
        {flight && (
          <>
            <SheetHeader className="border-b">
              <div className="flex items-center gap-3 pr-8">
                <span className="flex size-10 items-center justify-center rounded-xl bg-sec-flights/15">
                  <TypeIcon className="size-5 text-sec-flights" aria-hidden />
                </span>
                <div className="flex-1">
                  <SheetTitle className="font-mono text-xl">{flight.flightNumber}</SheetTitle>
                  <SheetDescription>
                    {airline?.name} · {getAircraftType(flight.aircraftTypeCode)?.name}
                  </SheetDescription>
                </div>
                <FlightStatusPill flight={flight} />
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-6 p-4">
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Type">{flight.type === 'ARRIVAL' ? 'Arrival' : 'Departure'}</Field>
                <Field label="Route">
                  {flight.origin} → {flight.destination}
                </Field>
                <Field label="Scheduled">
                  <span className="font-mono tabular-nums">{toHHMM(flight.scheduledTime)}</span>
                </Field>
                <Field label="Estimated">
                  <span className={delay > 0 ? 'font-mono font-medium text-status-warn tabular-nums' : 'font-mono tabular-nums'}>
                    {flight.status === 'CANCELLED' ? '—' : toHHMM(flight.estimatedTime)}
                  </span>
                </Field>
                <Field label="Actual">
                  <span className="font-mono tabular-nums">{flight.actualTime === null ? '—' : toHHMM(flight.actualTime)}</span>
                </Field>
                <Field label="Delay">
                  {delay > 0 ? `${delay} min${flight.delayReason ? ` · ${flight.delayReason}` : ''}` : 'On time'}
                </Field>
                <Field label="Gate">
                  <GateLabel gateId={flight.gateId} inConflict={!!conflict} muted={flight.status === 'CANCELLED'} />
                </Field>
                <Field label="Gate window">
                  <span className="font-mono tabular-nums">
                    {flight.gateId && flight.status !== 'CANCELLED' ? formatWindow(getWindow(flight)) : '—'}
                  </span>
                </Field>
                {flight.cancelReason && <Field label="Cancel reason">{flight.cancelReason}</Field>}
              </dl>

              {partner && (
                <p className="flex items-start gap-2 rounded-lg border border-status-critical/30 bg-status-critical/10 px-3 py-2 text-sm">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-status-critical" aria-hidden />
                  <span>
                    Gate conflict with <b className="font-mono">{partner.flightNumber}</b> on {conflict!.gateId} (
                    {formatWindow(getWindow(partner))}). Reassign one of the flights.
                  </span>
                </p>
              )}

              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">Actions</h3>
                <FlightActions flight={flight} />
              </section>

              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">History</h3>
                <div className="overflow-hidden rounded-lg border">
                  <EventList events={history} emptyText="No events for this flight yet." />
                </div>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
