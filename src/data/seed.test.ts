import { describe, expect, it } from 'vitest'
import type { Flight, FlightStatus, TimeWindow } from '@/domain/types'
import { DAY_END, DAY_START, LAST_MINUTE, SIM_NOW, fromHHMM } from '@/domain/time'
import { AIRPORT, getAircraftType, getAirline } from './reference'
import { SEED_FLIGHTS, SEED_GATES } from './seed'

// Structural invariants of the demo dataset (PRD 13.2, 13.3, 13.5).
// KPI values and scenarios S1–S5 are checked in T-07 once domain rules exist.

// Local copy of BR-10 / BR-14 so this test does not depend on T-06 code.
const windowOf = (f: Flight): TimeWindow =>
  f.type === 'DEPARTURE'
    ? { start: f.estimatedTime - 45, end: f.estimatedTime + 15 }
    : { start: f.estimatedTime - 15, end: f.estimatedTime + 45 }
const overlaps = (a: TimeWindow, b: TimeWindow) => a.start < b.end && b.start < a.end
const delayOf = (f: Flight) => f.estimatedTime - f.scheduledTime
const byNumber = (n: string) => SEED_FLIGHTS.find((f) => f.flightNumber === n)!
const FINAL: FlightStatus[] = ['DEPARTED', 'LANDED']

describe('seed gates', () => {
  it('has 12 gates and only B6 is closed (Maintenance)', () => {
    expect(SEED_GATES).toHaveLength(12)
    const closed = SEED_GATES.filter((g) => g.isClosed)
    expect(closed.map((g) => g.id)).toEqual(['B6'])
    expect(closed[0].closedReason).toBe('Maintenance')
    expect(SEED_GATES.filter((g) => g.sizeCategory === 'WIDE').map((g) => g.id)).toEqual(['A1', 'A2'])
  })
})

describe('seed flights: shape', () => {
  it('has 48 flights: 24 arrivals and 24 departures', () => {
    expect(SEED_FLIGHTS).toHaveLength(48)
    expect(SEED_FLIGHTS.filter((f) => f.type === 'ARRIVAL')).toHaveLength(24)
    expect(SEED_FLIGHTS.filter((f) => f.type === 'DEPARTURE')).toHaveLength(24)
  })

  it('has unique ids and flight numbers in the expected format', () => {
    expect(new Set(SEED_FLIGHTS.map((f) => f.id)).size).toBe(48)
    expect(new Set(SEED_FLIGHTS.map((f) => f.flightNumber)).size).toBe(48)
    for (const f of SEED_FLIGHTS) expect(f.flightNumber).toMatch(/^[A-Z]{2}\d{2,4}$/)
  })

  it('references existing airlines and aircraft types', () => {
    for (const f of SEED_FLIGHTS) {
      expect(getAirline(f.airlineCode), f.flightNumber).toBeDefined()
      expect(f.flightNumber.startsWith(f.airlineCode)).toBe(true)
      expect(getAircraftType(f.aircraftTypeCode), f.flightNumber).toBeDefined()
    }
  })

  it('uses the simulated airport on the correct side of the route', () => {
    for (const f of SEED_FLIGHTS) {
      const home = f.type === 'DEPARTURE' ? f.origin : f.destination
      expect(home.startsWith(AIRPORT.code), f.flightNumber).toBe(true)
    }
  })
})

describe('seed flights: statuses and times', () => {
  it('matches the status distribution in PRD 13.2', () => {
    const count = (s: FlightStatus) => SEED_FLIGHTS.filter((f) => f.status === s).length
    expect(count('DEPARTED')).toBe(9)
    expect(count('LANDED')).toBe(8)
    expect(count('BOARDING')).toBe(2)
    expect(count('DELAYED')).toBe(5)
    expect(count('SCHEDULED')).toBe(22)
    expect(count('CANCELLED')).toBe(2)
  })

  it('uses statuses that fit the flight type', () => {
    for (const f of SEED_FLIGHTS) {
      if (f.status === 'BOARDING' || f.status === 'DEPARTED') expect(f.type, f.flightNumber).toBe('DEPARTURE')
      if (f.status === 'LANDED') expect(f.type, f.flightNumber).toBe('ARRIVAL')
    }
  })

  it('keeps times inside the operating day and consistent with SIM_NOW', () => {
    for (const f of SEED_FLIGHTS) {
      expect(f.scheduledTime).toBeGreaterThanOrEqual(DAY_START)
      expect(f.scheduledTime).toBeLessThanOrEqual(DAY_END)
      expect(f.estimatedTime).toBeGreaterThanOrEqual(f.scheduledTime)
      expect(f.estimatedTime).toBeLessThanOrEqual(LAST_MINUTE)
      if (FINAL.includes(f.status)) {
        expect(f.estimatedTime, f.flightNumber).toBeLessThan(SIM_NOW)
        expect(f.actualTime).toBe(f.estimatedTime)
      } else {
        expect(f.actualTime, f.flightNumber).toBeNull()
      }
      if (['SCHEDULED', 'DELAYED', 'BOARDING'].includes(f.status)) {
        expect(f.estimatedTime, f.flightNumber).toBeGreaterThanOrEqual(SIM_NOW)
      }
      if (f.status === 'BOARDING') expect(f.estimatedTime).toBeLessThanOrEqual(SIM_NOW + 45)
    }
  })

  it('has exactly the delays from PRD 13.2 (total 265 min) with reasons', () => {
    const delayed = SEED_FLIGHTS.filter((f) => delayOf(f) > 0)
    expect(delayed.map(delayOf).sort((a, b) => a - b)).toEqual([20, 25, 30, 35, 40, 55, 60])
    expect(delayed.filter((f) => f.status === 'DELAYED')).toHaveLength(5)
    for (const f of SEED_FLIGHTS) expect(f.delayReason !== null, f.flightNumber).toBe(delayOf(f) > 0)
  })

  it('cancelled flights have a reason and no gate', () => {
    for (const f of SEED_FLIGHTS.filter((x) => x.status === 'CANCELLED')) {
      expect(f.cancelReason).not.toBeNull()
      expect(f.gateId).toBeNull()
    }
  })
})

describe('seed flights: gates', () => {
  it('leaves only LW330 without a gate among active flights', () => {
    const noGate = SEED_FLIGHTS.filter((f) => f.gateId === null && f.status !== 'CANCELLED')
    expect(noGate.map((f) => f.flightNumber)).toEqual(['LW330'])
  })

  it('assigns only existing open gates and wide aircraft only to WIDE gates', () => {
    for (const f of SEED_FLIGHTS.filter((x) => x.gateId !== null)) {
      const gate = SEED_GATES.find((g) => g.id === f.gateId)
      expect(gate, f.flightNumber).toBeDefined()
      expect(gate!.isClosed, f.flightNumber).toBe(false)
      if (getAircraftType(f.aircraftTypeCode)!.sizeCategory === 'WIDE') expect(gate!.sizeCategory).toBe('WIDE')
    }
  })

  it('has no overlapping gate windows (0 conflicts)', () => {
    const withGate = SEED_FLIGHTS.filter((f) => f.gateId !== null)
    for (const a of withGate) {
      for (const b of withGate) {
        if (a.id < b.id && a.gateId === b.gateId) {
          expect(overlaps(windowOf(a), windowOf(b)), `${a.flightNumber}/${b.flightNumber}`).toBe(false)
        }
      }
    }
  })

  it('keeps A5 free from 12:00 to 14:30 for the reassignment demo', () => {
    const reserve = { start: fromHHMM('12:00')!, end: fromHHMM('14:30')! }
    const onA5 = SEED_FLIGHTS.filter((f) => f.gateId === 'A5')
    for (const f of onA5) expect(overlaps(windowOf(f), reserve), f.flightNumber).toBe(false)
  })
})

describe('seed flights: demo flights (PRD 13.3)', () => {
  it.each([
    ['AU101', 'DEPARTURE', '12:30', 'A3'],
    ['DW220', 'ARRIVAL', '13:20', 'A3'],
    ['AU115', 'DEPARTURE', '13:00', 'A4'],
    ['LW330', 'DEPARTURE', '13:10', null],
    ['NS455', 'DEPARTURE', '14:40', 'B2'],
  ])('%s is a SCHEDULED %s at %s on gate %s', (number, type, time, gate) => {
    const f = byNumber(number)
    expect(f.type).toBe(type)
    expect(f.status).toBe('SCHEDULED')
    expect(f.scheduledTime).toBe(fromHHMM(time))
    expect(f.estimatedTime).toBe(f.scheduledTime)
    expect(f.gateId).toBe(gate)
  })

  it('AU101 delayed by 45 min would overlap DW220 on A3 and AU115 on A4', () => {
    const au101 = byNumber('AU101')
    const delayed = windowOf({ ...au101, estimatedTime: au101.estimatedTime + 45 })
    expect(overlaps(delayed, windowOf(byNumber('DW220')))).toBe(true)
    expect(overlaps(delayed, windowOf(byNumber('AU115')))).toBe(true)
  })
})
