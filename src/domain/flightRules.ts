import { fail, ok } from './result'
import { LAST_MINUTE } from './time'
import {
  CANCEL_REASONS,
  DELAY_REASONS,
  type CancelReason,
  type DelayReason,
  type Flight,
  type FlightStatus,
  type Result,
} from './types'

// Flight status rules (PRD 9.1–9.2, BR-01…BR-09). Pure functions: inputs are never mutated.

export const MIN_DELAY = 15
export const MAX_DELAY = 360
export const DELAY_STEP = 5

const FINAL_STATUSES: readonly FlightStatus[] = ['DEPARTED', 'LANDED', 'CANCELLED']
/** Statuses that can still change, be delayed, cancelled or (re)assigned a gate (BR-15). */
export const ACTIVE_STATUSES: readonly FlightStatus[] = ['SCHEDULED', 'DELAYED', 'BOARDING']

/** delayMinutes = max(0, estimated − scheduled). */
export function getDelayMinutes(flight: Flight): number {
  return Math.max(0, flight.estimatedTime - flight.scheduledTime)
}

/** DEPARTED, LANDED and CANCELLED never change again (BR-02). */
export function isFinal(flight: Flight): boolean {
  return FINAL_STATUSES.includes(flight.status)
}

export function isActive(flight: Flight): boolean {
  return ACTIVE_STATUSES.includes(flight.status)
}

/**
 * Every status the flight may move to next (state diagram, PRD 9.1).
 * DELAYED and CANCELLED are reached through applyDelay / cancelFlight; the rest through changeStatus.
 */
export function getAllowedTransitions(flight: Flight): FlightStatus[] {
  const progress: FlightStatus = flight.type === 'DEPARTURE' ? 'BOARDING' : 'LANDED'
  switch (flight.status) {
    case 'SCHEDULED':
    case 'DELAYED':
      return [progress, 'DELAYED', 'CANCELLED']
    case 'BOARDING':
      return ['DEPARTED', 'DELAYED', 'CANCELLED']
    default:
      return []
  }
}

/** BR-01: the single source of truth for allowed transitions. */
export function canTransition(flight: Flight, to: FlightStatus): boolean {
  return getAllowedTransitions(flight).includes(to)
}

export interface GateContext {
  /** The flight has a gate assigned. */
  hasGate: boolean
  /** The flight's gate window overlaps another flight's (BR-14). */
  hasConflict: boolean
}

/**
 * Manual status change: BOARDING, DEPARTED or LANDED only.
 * BR-03: BOARDING needs a gate without conflict. BR-20: DEPARTED needs a gate.
 * BR-04: DEPARTED / LANDED set actualTime = estimatedTime.
 */
export function changeStatus(flight: Flight, to: FlightStatus, gate: GateContext): Result<{ flight: Flight }> {
  if (to === 'DELAYED') return fail('Use the delay action to delay a flight.')
  if (to === 'CANCELLED') return fail('Use the cancel action to cancel a flight.')
  if (to === 'SCHEDULED') return fail('A flight cannot go back to Scheduled.')
  if (isFinal(flight)) return fail(`${flight.flightNumber} has a final status and cannot change.`)
  if (!canTransition(flight, to)) {
    return fail(`${flight.flightNumber} cannot change from ${flight.status} to ${to}.`)
  }
  if (to === 'BOARDING') {
    if (!gate.hasGate) return fail(`${flight.flightNumber} needs a gate before boarding.`)
    if (gate.hasConflict) return fail(`Resolve the gate conflict for ${flight.flightNumber} before boarding.`)
  }
  if (to === 'DEPARTED' && !gate.hasGate) {
    return fail(`${flight.flightNumber} needs a gate before departure.`)
  }
  const isCompletion = to === 'DEPARTED' || to === 'LANDED'
  return ok({
    flight: { ...flight, status: to, actualTime: isCompletion ? flight.estimatedTime : flight.actualTime },
  })
}

/** Validation of the delay amount (BR-06). Returns an error message or null. */
export function validateDelayMinutes(minutes: number): string | null {
  if (!Number.isInteger(minutes) || minutes < MIN_DELAY || minutes > MAX_DELAY) {
    return `Delay must be ${MIN_DELAY}–${MAX_DELAY} minutes.`
  }
  if (minutes % DELAY_STEP !== 0) return `Delay must be in steps of ${DELAY_STEP} minutes.`
  return null
}

/**
 * BR-06…BR-08: adds minutes to estimatedTime, sets DELAYED, keeps the gate.
 * Delays accumulate. A resulting gate conflict is NOT a reason to refuse (detected by gate rules).
 */
export function applyDelay(flight: Flight, minutes: number, reason: DelayReason): Result<{ flight: Flight }> {
  if (!isActive(flight)) return fail(`${flight.flightNumber} has a final status and cannot be delayed.`)
  const amountError = validateDelayMinutes(minutes)
  if (amountError) return fail(amountError)
  if (!DELAY_REASONS.includes(reason)) return fail('Choose a delay reason.')
  const estimatedTime = flight.estimatedTime + minutes
  if (estimatedTime > LAST_MINUTE) return fail('Exceeds operating day: the new time would be after 23:59.')
  return ok({ flight: { ...flight, estimatedTime, status: 'DELAYED', delayReason: reason } })
}

/** BR-09: cancelled flights release their gate; the old gate is returned for the event log. */
export function cancelFlight(
  flight: Flight,
  reason: CancelReason,
): Result<{ flight: Flight; previousGateId: string | null }> {
  if (!isActive(flight)) return fail(`${flight.flightNumber} has a final status and cannot be cancelled.`)
  if (!CANCEL_REASONS.includes(reason)) return fail('Choose a cancellation reason.')
  return ok({
    flight: { ...flight, status: 'CANCELLED', gateId: null, cancelReason: reason },
    previousGateId: flight.gateId,
  })
}
