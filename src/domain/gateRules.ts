import { getAircraftType } from '@/data/reference'
import { isActive } from './flightRules'
import { fail, ok } from './result'
import { toHHMM } from './time'
import {
  GATE_CLOSURE_REASONS,
  type Flight,
  type FlightStatus,
  type Gate,
  type GateClosureReason,
  type GateState,
  type Minutes,
  type Result,
  type TimeWindow,
} from './types'

// Gate rules (PRD 9.3–9.5, BR-10…BR-21). Pure functions: inputs are never mutated.
// Only gate.isClosed and flight.gateId are stored; everything here is derived (BR-13).

/** Look-ahead for RESERVED: a holding flight whose window starts within this many minutes. */
export const RESERVED_LOOKAHEAD = 120

/** BR-10: occupancy window from estimatedTime. DEP [est−45, est+15], ARR [est−15, est+45]. */
export function getWindow(flight: Flight): TimeWindow {
  const est = flight.estimatedTime
  return flight.type === 'DEPARTURE' ? { start: est - 45, end: est + 15 } : { start: est - 15, end: est + 45 }
}

/** BR-14: windows overlap when a.start < b.end && b.start < a.end. Touching edges do not overlap. */
export function windowsOverlap(a: TimeWindow, b: TimeWindow): boolean {
  return a.start < b.end && b.start < a.end
}

export function formatWindow(w: TimeWindow): string {
  return `${toHHMM(w.start)}–${toHHMM(w.end)}`
}

const HOLDING_STATUSES: readonly FlightStatus[] = ['SCHEDULED', 'DELAYED', 'BOARDING', 'LANDED']

/** BR-11: the flight occupies its gate (DEPARTED and CANCELLED do not). */
export function holdsGate(flight: Flight): boolean {
  return flight.gateId !== null && HOLDING_STATUSES.includes(flight.status)
}

/** Flights holding the given gate, sorted by window start. */
export function getGateAssignments(gateId: string, flights: Flight[]): Flight[] {
  return flights
    .filter((f) => f.gateId === gateId && holdsGate(f))
    .sort((a, b) => getWindow(a).start - getWindow(b).start)
}

/** BR-12: UNAVAILABLE > OCCUPIED > RESERVED > AVAILABLE, evaluated at simNow. */
export function getGateState(gate: Gate, flights: Flight[], simNow: Minutes): GateState {
  if (gate.isClosed) return 'UNAVAILABLE'
  const windows = getGateAssignments(gate.id, flights).map(getWindow)
  if (windows.some((w) => w.start <= simNow && simNow < w.end)) return 'OCCUPIED'
  if (windows.some((w) => w.start > simNow && w.start <= simNow + RESERVED_LOOKAHEAD)) return 'RESERVED'
  return 'AVAILABLE'
}

export interface GateConflict {
  gateId: string
  /** The two flight ids, ordered by window start. */
  flightIds: [string, string]
}

/** BR-14: every pair of flights holding the same gate with overlapping windows. */
export function detectConflicts(flights: Flight[]): GateConflict[] {
  const byGate = new Map<string, Flight[]>()
  for (const f of flights) {
    if (!holdsGate(f)) continue
    const list = byGate.get(f.gateId!) ?? []
    list.push(f)
    byGate.set(f.gateId!, list)
  }
  const conflicts: GateConflict[] = []
  for (const [gateId, list] of [...byGate].sort(([a], [b]) => a.localeCompare(b))) {
    const sorted = list.sort((a, b) => getWindow(a).start - getWindow(b).start)
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        if (windowsOverlap(getWindow(sorted[i]), getWindow(sorted[j]))) {
          conflicts.push({ gateId, flightIds: [sorted[i].id, sorted[j].id] })
        }
      }
    }
  }
  return conflicts
}

export function isInConflict(flightId: string, conflicts: GateConflict[]): boolean {
  return conflicts.some((c) => c.flightIds.includes(flightId))
}

/**
 * BR-15…BR-17: why the flight cannot use this gate, or null when it can.
 * Used both to disable options in the assign dialog and to guard the action itself.
 */
export function validateAssignment(flight: Flight, gate: Gate, flights: Flight[]): string | null {
  if (!isActive(flight)) return `${flight.flightNumber} has a final status.`
  if (gate.isClosed) return `Gate closed${gate.closedReason ? ` (${gate.closedReason})` : ''}`
  if (flight.gateId === gate.id) return 'Already assigned to this gate'
  const aircraft = getAircraftType(flight.aircraftTypeCode)
  if (aircraft?.sizeCategory === 'WIDE' && gate.sizeCategory !== 'WIDE') {
    return 'Wide-body aircraft needs a WIDE gate'
  }
  const window = getWindow(flight)
  const clash = getGateAssignments(gate.id, flights).find(
    (other) => other.id !== flight.id && windowsOverlap(window, getWindow(other)),
  )
  if (clash) return `Conflicts with ${clash.flightNumber} ${formatWindow(getWindow(clash))}`
  return null
}

/** BR-18: manual assignment never creates a conflict. Returns the updated flight and the old gate. */
export function assignGate(
  flight: Flight,
  gate: Gate,
  flights: Flight[],
): Result<{ flight: Flight; fromGateId: string | null }> {
  const reason = validateAssignment(flight, gate, flights)
  if (reason) return fail(reason)
  return ok({ flight: { ...flight, gateId: gate.id }, fromGateId: flight.gateId })
}

/**
 * BR-19, BR-21: closes the gate; active flights on it lose their gate (→ Gate required).
 * Final flights keep gateId for history.
 */
export function closeGate(
  gate: Gate,
  flights: Flight[],
  reason: GateClosureReason,
): Result<{ gate: Gate; flights: Flight[]; affectedFlightIds: string[] }> {
  if (gate.isClosed) return fail(`Gate ${gate.id} is already closed.`)
  if (!GATE_CLOSURE_REASONS.includes(reason)) return fail('Choose a closure reason.')
  const affectedFlightIds: string[] = []
  const updated = flights.map((f) => {
    if (f.gateId !== gate.id || !isActive(f)) return f
    affectedFlightIds.push(f.id)
    return { ...f, gateId: null }
  })
  return ok({ gate: { ...gate, isClosed: true, closedReason: reason }, flights: updated, affectedFlightIds })
}

/** FR-037 (P1): reopens a closed gate. Flights are not re-assigned automatically. */
export function reopenGate(gate: Gate): Result<{ gate: Gate }> {
  if (!gate.isClosed) return fail(`Gate ${gate.id} is already open.`)
  return ok({ gate: { ...gate, isClosed: false, closedReason: null } })
}

export interface GateSummary {
  gate: Gate
  state: GateState
  hasConflict: boolean
  /** Holding flight whose window contains simNow. */
  current: Flight | undefined
  /** Next holding flight whose window starts after simNow. */
  next: Flight | undefined
  /** Every non-cancelled flight using this gate today, incl. departed (FR-021). */
  flightsToday: number
}

/** Everything a gate card shows (FR-020…FR-022), derived from the same rules as the state. */
export function summarizeGate(gate: Gate, flights: Flight[], simNow: Minutes, conflicts: GateConflict[]): GateSummary {
  const holding = getGateAssignments(gate.id, flights)
  return {
    gate,
    state: getGateState(gate, flights, simNow),
    hasConflict: conflicts.some((c) => c.gateId === gate.id),
    current: holding.find((f) => getWindow(f).start <= simNow && simNow < getWindow(f).end),
    next: holding.find((f) => getWindow(f).start > simNow),
    flightsToday: flights.filter((f) => f.gateId === gate.id && f.status !== 'CANCELLED').length,
  }
}

/** Gate day plan for the details sheet: every non-cancelled flight on the gate, by window start. */
export function getGateDayPlan(gateId: string, flights: Flight[]): Flight[] {
  return flights
    .filter((f) => f.gateId === gateId && f.status !== 'CANCELLED')
    .sort((a, b) => getWindow(a).start - getWindow(b).start)
}

/** Flights that need operator action (FR-027): active without a gate, or in a gate conflict. */
export interface GateRequiredItem {
  flight: Flight
  problem: 'NO_GATE' | 'CONFLICT'
}

export function getGateRequired(flights: Flight[], conflicts = detectConflicts(flights)): GateRequiredItem[] {
  return flights
    .filter(isActive)
    .flatMap((flight): GateRequiredItem[] => {
      if (flight.gateId === null) return [{ flight, problem: 'NO_GATE' }]
      if (isInConflict(flight.id, conflicts)) return [{ flight, problem: 'CONFLICT' }]
      return []
    })
    .sort((a, b) => a.flight.estimatedTime - b.flight.estimatedTime)
}
