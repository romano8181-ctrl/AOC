import type { EventPayload, EventType, Flight, FlightStatus, Minutes, OperationalEvent } from './types'

// Operational event drafts (FR-034, BR-23). The domain stays deterministic: the store stamps
// each draft with an id and a real timestamp when it appends it to the log.

export type EventDraft = Omit<OperationalEvent, 'id' | 'createdAt'>

const STATUS_LABEL: Record<FlightStatus, string> = {
  SCHEDULED: 'Scheduled',
  DELAYED: 'Delayed',
  BOARDING: 'Boarding',
  DEPARTED: 'Departed',
  LANDED: 'Landed',
  CANCELLED: 'Cancelled',
}

function draft(
  type: EventType,
  simTime: Minutes,
  message: string,
  refs: { flightId?: string | null; gateId?: string | null },
  payload: EventPayload = {},
): EventDraft {
  return { type, simTime, message, flightId: refs.flightId ?? null, gateId: refs.gateId ?? null, payload }
}

export function flightDelayedEvent(flight: Flight, minutes: number, reason: string, simTime: Minutes): EventDraft {
  return draft(
    'FLIGHT_DELAYED',
    simTime,
    `${flight.flightNumber} delayed +${minutes} min (${reason})`,
    { flightId: flight.id, gateId: flight.gateId },
    { minutes, reason },
  )
}

export function flightCancelledEvent(
  flight: Flight,
  reason: string,
  previousGateId: string | null,
  simTime: Minutes,
): EventDraft {
  const gatePart = previousGateId ? ` — gate ${previousGateId} released` : ''
  return draft(
    'FLIGHT_CANCELLED',
    simTime,
    `${flight.flightNumber} cancelled (${reason})${gatePart}`,
    { flightId: flight.id, gateId: previousGateId },
    { reason, previousGateId },
  )
}

export function statusChangedEvent(flight: Flight, from: FlightStatus, to: FlightStatus, simTime: Minutes): EventDraft {
  return draft(
    'STATUS_CHANGED',
    simTime,
    `${flight.flightNumber} status: ${STATUS_LABEL[from]} → ${STATUS_LABEL[to]}`,
    { flightId: flight.id, gateId: flight.gateId },
    { fromStatus: from, toStatus: to },
  )
}

/** GATE_ASSIGNED for a flight without a gate, GATE_REASSIGNED when it moves. */
export function gateAssignedEvent(flight: Flight, fromGateId: string | null, toGateId: string, simTime: Minutes): EventDraft {
  return fromGateId === null
    ? draft('GATE_ASSIGNED', simTime, `${flight.flightNumber} assigned to gate ${toGateId}`, { flightId: flight.id, gateId: toGateId }, { fromGateId, toGateId })
    : draft(
        'GATE_REASSIGNED',
        simTime,
        `${flight.flightNumber} moved from gate ${fromGateId} to ${toGateId}`,
        { flightId: flight.id, gateId: toGateId },
        { fromGateId, toGateId },
      )
}

export function gateClosedEvent(gateId: string, reason: string, affectedFlightIds: string[], simTime: Minutes): EventDraft {
  const n = affectedFlightIds.length
  const impact = n === 0 ? 'no flights affected' : `${n} flight${n === 1 ? '' : 's'} need${n === 1 ? 's' : ''} a new gate`
  return draft('GATE_CLOSED', simTime, `Gate ${gateId} closed (${reason}) — ${impact}`, { gateId }, { reason, affectedFlightIds })
}

export function gateReopenedEvent(gateId: string, simTime: Minutes): EventDraft {
  return draft('GATE_REOPENED', simTime, `Gate ${gateId} reopened`, { gateId })
}

export function demoResetEvent(simTime: Minutes): EventDraft {
  return draft('DEMO_RESET', simTime, 'Demo data restored to the original scenario', {})
}
