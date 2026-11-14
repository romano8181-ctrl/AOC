import { applyDelay, isActive } from './flightRules'
import { closeGate, detectConflicts, getWindow } from './gateRules'
import { computeKpis, type KpiSummary } from './kpi'
import { fail, ok } from './result'
import type { Flight, Gate, Minutes, Result, TimeWindow } from './types'

// Impact preview (PRD 12.3, US-007 AC2): run the real domain action on a copy of the data and
// report what would change. Nothing is stored; the store action itself is unchanged.

export interface ConflictPreview {
  gateId: string
  other: Flight
}

export interface DelayImpact {
  flight: Flight
  window: TimeWindow | null
  /** Conflicts the delay would create for this flight (empty = safe). */
  newConflicts: ConflictPreview[]
  kpiBefore: KpiSummary
  kpiAfter: KpiSummary
}

/** Dry run of applyDelay. The reason does not change the outcome, so a default is used. */
export function previewDelay(
  flights: Flight[],
  gates: Gate[],
  simNow: Minutes,
  flightId: string,
  minutes: number,
): Result<DelayImpact> {
  const flight = flights.find((f) => f.id === flightId)
  if (!flight) return fail('Choose a flight.')
  const result = applyDelay(flight, minutes, 'Weather')
  if (!result.ok) return result
  const updated = result.value.flight
  const after = flights.map((f) => (f.id === updated.id ? updated : f))
  const before = new Set(detectConflicts(flights).map((c) => c.flightIds.join('|')))
  const newConflicts = detectConflicts(after)
    .filter((c) => c.flightIds.includes(updated.id) && !before.has(c.flightIds.join('|')))
    .map((c) => ({ gateId: c.gateId, other: after.find((f) => f.id === c.flightIds.find((id) => id !== updated.id))! }))
  return ok({
    flight: updated,
    window: updated.gateId ? getWindow(updated) : null,
    newConflicts,
    kpiBefore: computeKpis(flights, gates, simNow),
    kpiAfter: computeKpis(after, gates, simNow),
  })
}

export interface ClosureImpact {
  /** Active flights that would lose the gate (BR-19), by estimated time. */
  affected: Flight[]
  kpiBefore: KpiSummary
  kpiAfter: KpiSummary
}

/** Dry run of closeGate, using the same rule the store action uses. */
export function previewGateClosure(flights: Flight[], gates: Gate[], simNow: Minutes, gateId: string): Result<ClosureImpact> {
  const gate = gates.find((g) => g.id === gateId)
  if (!gate) return fail('Choose a gate.')
  const result = closeGate(gate, flights, 'Maintenance')
  if (!result.ok) return result
  const afterGates = gates.map((g) => (g.id === gateId ? result.value.gate : g))
  const ids = new Set(result.value.affectedFlightIds)
  return ok({
    affected: flights.filter((f) => ids.has(f.id) && isActive(f)).sort((a, b) => a.estimatedTime - b.estimatedTime),
    kpiBefore: computeKpis(flights, gates, simNow),
    kpiAfter: computeKpis(result.value.flights, afterGates, simNow),
  })
}
