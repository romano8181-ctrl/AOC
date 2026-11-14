import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as events from '@/domain/events'
import type { EventDraft } from '@/domain/events'
import * as flightRules from '@/domain/flightRules'
import * as gateRules from '@/domain/gateRules'
import { fail, ok } from '@/domain/result'
import type {
  CancelReason,
  DelayReason,
  Flight,
  FlightStatus,
  Gate,
  GateClosureReason,
  OperationalEvent,
  Result,
} from '@/domain/types'
import {
  STORAGE_KEY,
  STORAGE_VERSION,
  createSafeStorage,
  createSeedData,
  type AocData,
  type PersistedShape,
} from './persistence'

// Single source of truth (PRD 11). Actions call domain rules; on success they update state and
// append exactly one event (BR-23). A refused action changes nothing and logs nothing.
// UI never mutates state directly and never computes KPIs here (selectors do, T-09).

export interface AocActions {
  applyDelay: (flightId: string, minutes: number, reason: DelayReason) => Result<{ flight: Flight }>
  cancelFlight: (flightId: string, reason: CancelReason) => Result<{ flight: Flight }>
  changeStatus: (flightId: string, to: FlightStatus) => Result<{ flight: Flight }>
  assignGate: (flightId: string, gateId: string) => Result<{ flight: Flight }>
  closeGate: (gateId: string, reason: GateClosureReason) => Result<{ gate: Gate; affectedFlightIds: string[] }>
  reopenGate: (gateId: string) => Result<{ gate: Gate }>
  resetDemo: () => void
  clearStorageWarning: () => void
}

export type AocState = PersistedShape & AocActions

/** Stamps a deterministic domain draft with an id and a real timestamp. */
function stamp(draft: EventDraft): OperationalEvent {
  return { ...draft, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
}

const replaceFlight = (flights: Flight[], updated: Flight) => flights.map((f) => (f.id === updated.id ? updated : f))
const replaceGate = (gates: Gate[], updated: Gate) => gates.map((g) => (g.id === updated.id ? updated : g))

export const useAocStore = create<AocState>()(
  persist(
    (set, get) => {
      const findFlight = (id: string) => get().flights.find((f) => f.id === id)
      const findGate = (id: string) => get().gates.find((g) => g.id === id)

      return {
        ...createSeedData(),
        storageWarning: null,

        applyDelay: (flightId, minutes, reason) => {
          const flight = findFlight(flightId)
          if (!flight) return fail('Flight not found.')
          const result = flightRules.applyDelay(flight, minutes, reason)
          if (!result.ok) return result
          const { simNow } = get()
          set((s) => ({
            flights: replaceFlight(s.flights, result.value.flight),
            events: [...s.events, stamp(events.flightDelayedEvent(flight, minutes, reason, simNow))],
          }))
          return result
        },

        cancelFlight: (flightId, reason) => {
          const flight = findFlight(flightId)
          if (!flight) return fail('Flight not found.')
          const result = flightRules.cancelFlight(flight, reason)
          if (!result.ok) return result
          const { simNow } = get()
          set((s) => ({
            flights: replaceFlight(s.flights, result.value.flight),
            events: [...s.events, stamp(events.flightCancelledEvent(flight, reason, result.value.previousGateId, simNow))],
          }))
          return ok({ flight: result.value.flight })
        },

        changeStatus: (flightId, to) => {
          const flight = findFlight(flightId)
          if (!flight) return fail('Flight not found.')
          const conflicts = gateRules.detectConflicts(get().flights)
          const result = flightRules.changeStatus(flight, to, {
            hasGate: flight.gateId !== null,
            hasConflict: gateRules.isInConflict(flight.id, conflicts),
          })
          if (!result.ok) return result
          const { simNow } = get()
          set((s) => ({
            flights: replaceFlight(s.flights, result.value.flight),
            events: [...s.events, stamp(events.statusChangedEvent(flight, flight.status, to, simNow))],
          }))
          return result
        },

        assignGate: (flightId, gateId) => {
          const flight = findFlight(flightId)
          if (!flight) return fail('Flight not found.')
          const gate = findGate(gateId)
          if (!gate) return fail('Gate not found.')
          const result = gateRules.assignGate(flight, gate, get().flights)
          if (!result.ok) return result
          const { simNow } = get()
          set((s) => ({
            flights: replaceFlight(s.flights, result.value.flight),
            events: [...s.events, stamp(events.gateAssignedEvent(flight, result.value.fromGateId, gateId, simNow))],
          }))
          return ok({ flight: result.value.flight })
        },

        closeGate: (gateId, reason) => {
          const gate = findGate(gateId)
          if (!gate) return fail('Gate not found.')
          const result = gateRules.closeGate(gate, get().flights, reason)
          if (!result.ok) return result
          const { simNow } = get()
          const { affectedFlightIds } = result.value
          set((s) => ({
            gates: replaceGate(s.gates, result.value.gate),
            flights: result.value.flights,
            events: [...s.events, stamp(events.gateClosedEvent(gateId, reason, affectedFlightIds, simNow))],
          }))
          return ok({ gate: result.value.gate, affectedFlightIds })
        },

        reopenGate: (gateId) => {
          const gate = findGate(gateId)
          if (!gate) return fail('Gate not found.')
          const result = gateRules.reopenGate(gate)
          if (!result.ok) return result
          const { simNow } = get()
          set((s) => ({
            gates: replaceGate(s.gates, result.value.gate),
            events: [...s.events, stamp(events.gateReopenedEvent(gateId, simNow))],
          }))
          return result
        },

        // BR-24: seed + exactly one DEMO_RESET event.
        resetDemo: () => {
          const seed = createSeedData()
          set({ ...seed, events: [stamp(events.demoResetEvent(seed.simNow))], storageWarning: null })
        },

        clearStorageWarning: () => set({ storageWarning: null }),
      }
    },
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createSafeStorage(),
      partialize: (s): PersistedShape => ({
        flights: s.flights,
        gates: s.gates,
        events: s.events,
        simNow: s.simNow,
        storageWarning: null,
      }),
    },
  ),
)

/** Current saved data only (no actions). Handy for tests and debugging. */
export function getAocData(): AocData {
  const { flights, gates, events: log, simNow } = useAocStore.getState()
  return { flights, gates, events: log, simNow }
}
