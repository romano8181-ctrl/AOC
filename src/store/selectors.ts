import { useMemo } from 'react'
import { detectConflicts, getGateRequired, getGateState } from '@/domain/gateRules'
import { computeAnalytics, computeKpis } from '@/domain/kpi'
import { buildAlerts, eventsNewestFirst, getFlightEvents, getUpcomingFlights } from '@/domain/overview'
import type { Gate, GateState } from '@/domain/types'
import { useAocStore } from './useAocStore'

// Read-only hooks for the UI (PRD 11). They select raw slices from the store and derive
// everything with domain functions inside useMemo: no logic is duplicated in components.
// Each hook selects primitive slices, so React re-renders only when the data really changes.

export const useFlights = () => useAocStore((s) => s.flights)
export const useGates = () => useAocStore((s) => s.gates)
export const useEvents = () => useAocStore((s) => s.events)
export const useSimNow = () => useAocStore((s) => s.simNow)

export function useFlight(flightId: string | null) {
  const flights = useFlights()
  return useMemo(() => (flightId ? flights.find((f) => f.id === flightId) : undefined), [flights, flightId])
}

export function useKpis() {
  const flights = useFlights()
  const gates = useGates()
  const simNow = useSimNow()
  return useMemo(() => computeKpis(flights, gates, simNow), [flights, gates, simNow])
}

export function useAnalytics() {
  const flights = useFlights()
  const gates = useGates()
  const simNow = useSimNow()
  return useMemo(() => computeAnalytics(flights, gates, simNow), [flights, gates, simNow])
}

export function useConflicts() {
  const flights = useFlights()
  return useMemo(() => detectConflicts(flights), [flights])
}

export interface GateWithState {
  gate: Gate
  state: GateState
}

export function useGateStates(): GateWithState[] {
  const flights = useFlights()
  const gates = useGates()
  const simNow = useSimNow()
  return useMemo(() => gates.map((gate) => ({ gate, state: getGateState(gate, flights, simNow) })), [gates, flights, simNow])
}

export function useGateRequired() {
  const flights = useFlights()
  const conflicts = useConflicts()
  return useMemo(() => getGateRequired(flights, conflicts), [flights, conflicts])
}

export function useAlerts() {
  const flights = useFlights()
  const conflicts = useConflicts()
  return useMemo(() => buildAlerts(flights, conflicts), [flights, conflicts])
}

export function useUpcomingFlights() {
  const flights = useFlights()
  const simNow = useSimNow()
  return useMemo(() => getUpcomingFlights(flights, simNow), [flights, simNow])
}

export function useRecentEvents(limit?: number) {
  const events = useEvents()
  return useMemo(() => eventsNewestFirst(events, limit), [events, limit])
}

export function useFlightEvents(flightId: string | null) {
  const events = useEvents()
  return useMemo(() => (flightId ? getFlightEvents(events, flightId) : []), [events, flightId])
}
