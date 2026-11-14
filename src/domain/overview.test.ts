import { describe, expect, it } from 'vitest'
import { SEED_FLIGHTS } from '@/data/seed'
import { applyDelay, cancelFlight } from './flightRules'
import { buildAlerts, eventsNewestFirst, getFlightEvents, getUpcomingFlights } from './overview'
import { SIM_NOW } from './time'
import type { Flight, OperationalEvent, Result } from './types'

const byNumber = (n: string, flights: Flight[] = SEED_FLIGHTS) => flights.find((f) => f.flightNumber === n)!
const replace = (flights: Flight[], updated: Flight) => flights.map((f) => (f.id === updated.id ? updated : f))
function unwrap<T>(r: Result<T>): T {
  if (!r.ok) throw new Error(r.reason)
  return r.value
}
const afterS1 = () => replace(SEED_FLIGHTS, unwrap(applyDelay(byNumber('AU101'), 45, 'Weather')).flight)

describe('getUpcomingFlights (FR-009)', () => {
  it('seed at 12:00: flights in 12:00–14:00, sorted by time', () => {
    expect(getUpcomingFlights(SEED_FLIGHTS, SIM_NOW).map((f) => f.flightNumber)).toEqual([
      'BX503', 'AU101', 'DW207', 'AU115', 'LW330', 'DW220', 'AU108',
    ])
  })

  it('uses the estimated time, so a delay can move a flight out of the window', () => {
    const flights = replace(SEED_FLIGHTS, unwrap(applyDelay(byNumber('AU108'), 30, 'Crew')).flight)
    expect(getUpcomingFlights(flights, SIM_NOW).map((f) => f.flightNumber)).not.toContain('AU108')
  })

  it('excludes cancelled flights and respects the limit', () => {
    const flights = replace(SEED_FLIGHTS, unwrap(cancelFlight(byNumber('AU101'), 'Weather')).flight)
    expect(getUpcomingFlights(flights, SIM_NOW).map((f) => f.flightNumber)).not.toContain('AU101')
    expect(getUpcomingFlights(SEED_FLIGHTS, SIM_NOW, 600, 3)).toHaveLength(3)
  })
})

describe('buildAlerts (FR-008, US-002)', () => {
  it('seed: one warning — LW330 needs a gate', () => {
    expect(buildAlerts(SEED_FLIGHTS)).toEqual([
      {
        id: `no-gate-${byNumber('LW330').id}`,
        kind: 'NO_GATE',
        severity: 'warning',
        message: 'LW330 — gate required',
        flightIds: [byNumber('LW330').id],
        gateId: null,
      },
    ])
  })

  it('after S1 the critical conflict comes first (US-002 AC1)', () => {
    const alerts = buildAlerts(afterS1())
    expect(alerts.map((a) => [a.severity, a.message])).toEqual([
      ['critical', 'Gate A3 conflict: AU101 / DW220'],
      ['warning', 'LW330 — gate required'],
    ])
    expect(alerts[0].gateId).toBe('A3')
  })

  it('no alerts after the conflict and the missing gate are resolved (US-002 AC2, AC3)', () => {
    const flights = afterS1().map((f) => {
      if (f.flightNumber === 'AU101') return { ...f, gateId: 'A5' }
      if (f.flightNumber === 'LW330') return { ...f, gateId: 'B3' }
      return f
    })
    expect(buildAlerts(flights)).toEqual([])
  })
})

describe('event lists (FR-035, FR-016)', () => {
  const ev = (id: string, flightId: string | null, affected?: string[]): OperationalEvent => ({
    id,
    simTime: SIM_NOW,
    createdAt: '2026-11-18T10:00:00.000Z',
    type: 'FLIGHT_DELAYED',
    message: id,
    flightId,
    gateId: null,
    payload: affected ? { affectedFlightIds: affected } : {},
  })
  const log = [ev('e1', 'F-1'), ev('e2', 'F-2'), ev('e3', null, ['F-1', 'F-3'])]

  it('shows newest first without changing the stored order', () => {
    expect(eventsNewestFirst(log).map((e) => e.id)).toEqual(['e3', 'e2', 'e1'])
    expect(eventsNewestFirst(log, 2).map((e) => e.id)).toEqual(['e3', 'e2'])
    expect(log.map((e) => e.id)).toEqual(['e1', 'e2', 'e3'])
  })

  it('a flight history includes gate closures that affected it', () => {
    expect(getFlightEvents(log, 'F-1').map((e) => e.id)).toEqual(['e3', 'e1'])
    expect(getFlightEvents(log, 'F-9')).toEqual([])
  })
})
