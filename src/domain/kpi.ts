import { AIRLINES } from '@/data/reference'
import { getDelayMinutes } from './flightRules'
import { getGateState, getWindow } from './gateRules'
import { DAY_END, DAY_START, ON_TIME_THRESHOLD, OPERATING_MINUTES } from './time'
import type { Flight, FlightStatus, Gate, Minutes } from './types'

// KPI and analytics formulas (PRD 7, FR-001…FR-007, FR-038…FR-043).
// Derived only: never stored (BR-22). Overview and Analytics both use these functions,
// so the same number is always the same on every screen.

/** On time = not cancelled and delay < 15 min (A15). */
export function isOnTime(flight: Flight): boolean {
  return flight.status !== 'CANCELLED' && getDelayMinutes(flight) < ON_TIME_THRESHOLD
}

/**
 * Delayed (KPI meaning) = not cancelled and delay ≥ 15 min. Includes completed flights that
 * were late, unlike the DELAYED status. Also drives the "Delayed ≥ 15 min" filter (FR-013).
 */
export function isDelayedKpi(flight: Flight): boolean {
  return flight.status !== 'CANCELLED' && getDelayMinutes(flight) >= ON_TIME_THRESHOLD
}

const round1 = (value: number) => Math.round(value * 10) / 10

function averageDelay(flights: Flight[]): number {
  const delayed = flights.filter(isDelayedKpi)
  if (delayed.length === 0) return 0
  return Math.round(delayed.reduce((sum, f) => sum + getDelayMinutes(f), 0) / delayed.length)
}

export interface KpiSummary {
  total: number
  arrivals: number
  departures: number
  onTime: number
  delayed: number
  cancelled: number
  activeGates: number
  totalGates: number
  /** Mean delay of KPI-delayed flights, whole minutes; 0 when none. */
  avgDelayMinutes: number
  /** onTime / (total − cancelled) × 100, one decimal; null when nothing is left to measure. */
  otpPercent: number | null
}

/** FR-001…FR-007, FR-038. Invariant: onTime + delayed + cancelled = total. */
export function computeKpis(flights: Flight[], gates: Gate[], simNow: Minutes): KpiSummary {
  const total = flights.length
  const onTime = flights.filter(isOnTime).length
  const delayed = flights.filter(isDelayedKpi).length
  const cancelled = flights.filter((f) => f.status === 'CANCELLED').length
  const measured = total - cancelled
  return {
    total,
    arrivals: flights.filter((f) => f.type === 'ARRIVAL').length,
    departures: flights.filter((f) => f.type === 'DEPARTURE').length,
    onTime,
    delayed,
    cancelled,
    activeGates: gates.filter((g) => getGateState(g, flights, simNow) !== 'UNAVAILABLE').length,
    totalGates: gates.length,
    avgDelayMinutes: averageDelay(flights),
    otpPercent: measured === 0 ? null : round1((onTime / measured) * 100),
  }
}

export const STATUS_ORDER: FlightStatus[] = ['SCHEDULED', 'BOARDING', 'DELAYED', 'DEPARTED', 'LANDED', 'CANCELLED']

export interface GateUtilization {
  gateId: string
  /** Minutes of occupancy windows inside 06:00–22:00. */
  minutes: number
  /** minutes / 960 × 100, one decimal. */
  percent: number
}

export interface HourlyMovements {
  /** 6..21 */
  hour: number
  arrivals: number
  departures: number
}

export interface AirlineDelay {
  airlineCode: string
  airlineName: string
  /** Mean delay of KPI-delayed flights of this airline; 0 when none. */
  avgDelayMinutes: number
  delayedFlights: number
}

export interface Analytics {
  otpPercent: number | null
  avgDelayMinutes: number
  cancelled: number
  /** cancelled / total × 100, one decimal. */
  cancelledPercent: number
  statusDistribution: { status: FlightStatus; count: number }[]
  gateUtilization: GateUtilization[]
  movementsByHour: HourlyMovements[]
  avgDelayByAirline: AirlineDelay[]
}

/**
 * FR-040: Σ occupancy-window minutes per gate, clipped to the operating day, / 960.
 * Cancelled flights (no gate) are not counted; departed flights are (they used the gate).
 */
export function computeGateUtilization(flights: Flight[], gates: Gate[]): GateUtilization[] {
  return gates.map((gate) => {
    const minutes = flights
      .filter((f) => f.gateId === gate.id && f.status !== 'CANCELLED')
      .reduce((sum, f) => {
        const w = getWindow(f)
        return sum + Math.max(0, Math.min(w.end, DAY_END) - Math.max(w.start, DAY_START))
      }, 0)
    return { gateId: gate.id, minutes, percent: round1((minutes / OPERATING_MINUTES) * 100) }
  })
}

/** FR-038…FR-043. */
export function computeAnalytics(flights: Flight[], gates: Gate[], simNow: Minutes): Analytics {
  const kpis = computeKpis(flights, gates, simNow)
  const hours = Array.from({ length: (DAY_END - DAY_START) / 60 }, (_, i) => DAY_START / 60 + i)
  return {
    otpPercent: kpis.otpPercent,
    avgDelayMinutes: kpis.avgDelayMinutes,
    cancelled: kpis.cancelled,
    cancelledPercent: kpis.total === 0 ? 0 : round1((kpis.cancelled / kpis.total) * 100),
    statusDistribution: STATUS_ORDER.map((status) => ({
      status,
      count: flights.filter((f) => f.status === status).length,
    })),
    gateUtilization: computeGateUtilization(flights, gates),
    movementsByHour: hours.map((hour) => {
      const inHour = flights.filter((f) => Math.floor(f.scheduledTime / 60) === hour)
      return {
        hour,
        arrivals: inHour.filter((f) => f.type === 'ARRIVAL').length,
        departures: inHour.filter((f) => f.type === 'DEPARTURE').length,
      }
    }),
    avgDelayByAirline: AIRLINES.map((airline) => {
      const own = flights.filter((f) => f.airlineCode === airline.code)
      return {
        airlineCode: airline.code,
        airlineName: airline.name,
        avgDelayMinutes: averageDelay(own),
        delayedFlights: own.filter(isDelayedKpi).length,
      }
    }),
  }
}
