import { detectConflicts, getGateRequired, type GateConflict } from './gateRules'
import type { Flight, Minutes, OperationalEvent } from './types'

// Derived lists for the Overview and the event log (FR-008, FR-009, FR-035). Pure functions.

export const UPCOMING_WINDOW = 120
export const UPCOMING_LIMIT = 10

/** FR-009: not cancelled, estimatedTime in [simNow, simNow + 120], sorted by time, max 10. */
export function getUpcomingFlights(
  flights: Flight[],
  simNow: Minutes,
  windowMinutes = UPCOMING_WINDOW,
  limit = UPCOMING_LIMIT,
): Flight[] {
  return flights
    .filter((f) => f.status !== 'CANCELLED' && f.estimatedTime >= simNow && f.estimatedTime <= simNow + windowMinutes)
    .sort((a, b) => a.estimatedTime - b.estimatedTime || a.flightNumber.localeCompare(b.flightNumber))
    .slice(0, limit)
}

export interface Alert {
  /** Stable key for React lists. */
  id: string
  kind: 'CONFLICT' | 'NO_GATE'
  severity: 'critical' | 'warning'
  message: string
  flightIds: string[]
  gateId: string | null
}

/**
 * FR-008: one critical alert per gate conflict pair (US-002 edge case), then one warning per
 * active flight without a gate. Conflicts come first.
 */
export function buildAlerts(flights: Flight[], conflicts: GateConflict[] = detectConflicts(flights)): Alert[] {
  const numberOf = (id: string) => flights.find((f) => f.id === id)?.flightNumber ?? id
  const conflictAlerts = conflicts.map<Alert>((c) => ({
    id: `conflict-${c.gateId}-${c.flightIds.join('-')}`,
    kind: 'CONFLICT',
    severity: 'critical',
    message: `Gate ${c.gateId} conflict: ${numberOf(c.flightIds[0])} / ${numberOf(c.flightIds[1])}`,
    flightIds: [...c.flightIds],
    gateId: c.gateId,
  }))
  const noGateAlerts = getGateRequired(flights, conflicts)
    .filter((item) => item.problem === 'NO_GATE')
    .map<Alert>(({ flight }) => ({
      id: `no-gate-${flight.id}`,
      kind: 'NO_GATE',
      severity: 'warning',
      message: `${flight.flightNumber} — gate required`,
      flightIds: [flight.id],
      gateId: null,
    }))
  return [...conflictAlerts, ...noGateAlerts]
}

/** Event log display order: newest first (FR-035). The stored log stays chronological. */
export function eventsNewestFirst(events: OperationalEvent[], limit?: number): OperationalEvent[] {
  const reversed = [...events].reverse()
  return limit === undefined ? reversed : reversed.slice(0, limit)
}

/** Events that mention the flight, newest first (FR-016 history). */
export function getFlightEvents(events: OperationalEvent[], flightId: string): OperationalEvent[] {
  return eventsNewestFirst(
    events.filter((e) => e.flightId === flightId || (e.payload.affectedFlightIds ?? []).includes(flightId)),
  )
}
