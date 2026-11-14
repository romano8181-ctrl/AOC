// Domain types for AOC (PRD section 10). Pure types: no React, no store.
// Times are always `Minutes`: minutes since 00:00 of the simulated day (12:30 = 750).

/** Minutes since 00:00 of the simulated day, 0..1439. */
export type Minutes = number

/** Time interval [start, end] in minutes. Windows that only touch at an edge do not overlap (BR-14). */
export interface TimeWindow {
  start: Minutes
  end: Minutes
}

// ---------- Reference data (static, not in the store) ----------

export interface Airport {
  /** IATA-like code, e.g. 'AUR'. */
  code: string
  name: string
  city: string
  isSimulated: true
}

export interface Airline {
  /** Two-letter code, also the flight number prefix, e.g. 'AU'. */
  code: string
  name: string
  /** Brand color used in charts and badges (hex). */
  color: string
}

export type SizeCategory = 'NARROW' | 'WIDE'

export interface AircraftType {
  /** e.g. 'A320' */
  code: string
  name: string
  sizeCategory: SizeCategory
}

// ---------- Gates ----------

export type Terminal = 'A' | 'B'

export interface Gate {
  /** 'A1'..'A6', 'B1'..'B6' */
  id: string
  terminal: Terminal
  sizeCategory: SizeCategory
  isClosed: boolean
  /** Required when isClosed is true. */
  closedReason: string | null
}

/** Derived gate state (BR-12). Never stored. */
export type GateState = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'UNAVAILABLE'

// ---------- Flights ----------

export type FlightType = 'ARRIVAL' | 'DEPARTURE'

/** Flight statuses (PRD 9.1). BOARDING/DEPARTED are departure-only, LANDED is arrival-only. */
export type FlightStatus = 'SCHEDULED' | 'DELAYED' | 'BOARDING' | 'DEPARTED' | 'LANDED' | 'CANCELLED'

export interface Flight {
  /** e.g. 'F-014' */
  id: string
  /** e.g. 'AU101'; unique for the day. */
  flightNumber: string
  airlineCode: string
  type: FlightType
  /** Airport code + city, e.g. 'WAW Warsaw'. For DEPARTURE this is the simulated airport. */
  origin: string
  /** For ARRIVAL this is the simulated airport. */
  destination: string
  scheduledTime: Minutes
  /** >= scheduledTime, <= 1439. Delays move this. */
  estimatedTime: Minutes
  /** Only for DEPARTED / LANDED. */
  actualTime: Minutes | null
  status: FlightStatus
  /** null when no gate is assigned or the flight is cancelled. */
  gateId: string | null
  aircraftTypeCode: string
  delayReason: DelayReason | null
  cancelReason: CancelReason | null
}

// ---------- Reasons (values for the simulator selects) ----------

export const DELAY_REASONS = [
  'Weather',
  'Technical',
  'Crew',
  'ATC restriction',
  'Late inbound aircraft',
  'Ground handling',
] as const
export type DelayReason = (typeof DELAY_REASONS)[number]

export const CANCEL_REASONS = ['Weather', 'Technical', 'Crew', 'Operational', 'Commercial'] as const
export type CancelReason = (typeof CANCEL_REASONS)[number]

export const GATE_CLOSURE_REASONS = [
  'Maintenance',
  'Equipment failure',
  'Security',
  'Cleaning',
] as const
export type GateClosureReason = (typeof GATE_CLOSURE_REASONS)[number]

// ---------- Operational events (append-only audit log) ----------

export type EventType =
  | 'FLIGHT_DELAYED'
  | 'FLIGHT_CANCELLED'
  | 'STATUS_CHANGED'
  | 'GATE_ASSIGNED'
  | 'GATE_REASSIGNED'
  | 'GATE_CLOSED'
  | 'GATE_REOPENED'
  | 'DEMO_RESET'

export interface EventPayload {
  minutes?: number
  reason?: string
  fromStatus?: FlightStatus
  toStatus?: FlightStatus
  fromGateId?: string | null
  toGateId?: string
  previousGateId?: string | null
  affectedFlightIds?: string[]
}

export interface OperationalEvent {
  id: string
  /** Simulated time of the event. */
  simTime: Minutes
  /** Real ISO timestamp, used for ordering. */
  createdAt: string
  type: EventType
  /** Human-readable, e.g. 'AU101 delayed +45 min (Weather)'. */
  message: string
  flightId: string | null
  gateId: string | null
  payload: EventPayload
}

// ---------- Results ----------

/** Domain functions never throw: they return a Result (see result.ts). */
export type Result<T> = { ok: true; value: T } | { ok: false; reason: string }
