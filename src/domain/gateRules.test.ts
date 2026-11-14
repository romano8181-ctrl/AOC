import { describe, expect, it } from 'vitest'
import { SEED_FLIGHTS, SEED_GATES } from '@/data/seed'
import { applyDelay } from './flightRules'
import {
  assignGate,
  closeGate,
  detectConflicts,
  getGateAssignments,
  getGateRequired,
  getGateState,
  getWindow,
  holdsGate,
  reopenGate,
  validateAssignment,
  windowsOverlap,
} from './gateRules'
import { SIM_NOW, fromHHMM } from './time'
import type { Flight, Gate, Result } from './types'

const t = (hhmm: string) => fromHHMM(hhmm)!
const gate = (id: string, gates: Gate[] = SEED_GATES) => gates.find((g) => g.id === id)!
const flight = (number: string, flights: Flight[] = SEED_FLIGHTS) => flights.find((f) => f.flightNumber === number)!
const replace = (flights: Flight[], updated: Flight) => flights.map((f) => (f.id === updated.id ? updated : f))

function expectOk<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(`Expected ok, got: ${result.reason}`)
  return result.value
}

/** Seed after scenario S1: AU101 delayed by 45 min (Weather). */
function afterS1(): Flight[] {
  return replace(SEED_FLIGHTS, expectOk(applyDelay(flight('AU101'), 45, 'Weather')).flight)
}

describe('getWindow (BR-10)', () => {
  it('departure: [est − 45, est + 15]', () => {
    expect(getWindow(flight('AU101'))).toEqual({ start: t('11:45'), end: t('12:45') })
  })

  it('arrival: [est − 15, est + 45]', () => {
    expect(getWindow(flight('DW220'))).toEqual({ start: t('13:05'), end: t('14:05') })
  })

  it('follows estimatedTime after a delay', () => {
    expect(getWindow(flight('AU101', afterS1()))).toEqual({ start: t('12:30'), end: t('13:30') })
  })
})

describe('windowsOverlap (BR-14, TC-14)', () => {
  it('detects a real overlap', () => {
    expect(windowsOverlap({ start: 100, end: 160 }, { start: 150, end: 210 })).toBe(true)
  })

  it('touching edges (end1 = start2) are not a conflict', () => {
    expect(windowsOverlap({ start: 100, end: 160 }, { start: 160, end: 220 })).toBe(false)
  })

  it('is symmetric and handles containment', () => {
    const outer = { start: 100, end: 300 }
    const inner = { start: 150, end: 200 }
    expect(windowsOverlap(outer, inner)).toBe(true)
    expect(windowsOverlap(inner, outer)).toBe(true)
  })
})

describe('holdsGate (BR-11)', () => {
  it('SCHEDULED, DELAYED, BOARDING, LANDED hold the gate; DEPARTED and CANCELLED do not', () => {
    const base = flight('AU101')
    expect(holdsGate({ ...base, status: 'SCHEDULED' })).toBe(true)
    expect(holdsGate({ ...base, status: 'DELAYED' })).toBe(true)
    expect(holdsGate({ ...base, status: 'BOARDING' })).toBe(true)
    expect(holdsGate({ ...base, status: 'LANDED' })).toBe(true)
    expect(holdsGate({ ...base, status: 'DEPARTED' })).toBe(false)
    expect(holdsGate({ ...base, status: 'CANCELLED', gateId: null })).toBe(false)
    expect(holdsGate({ ...base, gateId: null })).toBe(false)
  })
})

describe('getGateState (BR-12, US-005)', () => {
  const stateOf = (id: string, flights = SEED_FLIGHTS, gates = SEED_GATES) =>
    getGateState(gate(id, gates), flights, SIM_NOW)

  it('closed gate B6 is UNAVAILABLE (US-005 AC1)', () => {
    expect(stateOf('B6')).toBe('UNAVAILABLE')
  })

  it('A3 is OCCUPIED at 12:00 by AU101 (window 11:45–12:45, US-005 AC2)', () => {
    expect(stateOf('A3')).toBe('OCCUPIED')
  })

  it('A5 has nothing within 2 hours and is AVAILABLE', () => {
    expect(stateOf('A5')).toBe('AVAILABLE')
  })

  it('a gate whose next window starts within 120 min is RESERVED', () => {
    const only = [{ ...flight('DW220') }]
    expect(getGateState(gate('A3'), only, SIM_NOW)).toBe('RESERVED')
    expect(getGateState(gate('A3'), only, t('10:00'))).toBe('AVAILABLE')
  })

  it('11 of 12 gates are active in the seed', () => {
    const active = SEED_GATES.filter((g) => getGateState(g, SEED_FLIGHTS, SIM_NOW) !== 'UNAVAILABLE')
    expect(active).toHaveLength(11)
  })
})

describe('detectConflicts (BR-14, BR-08)', () => {
  it('finds no conflicts in the seed', () => {
    expect(detectConflicts(SEED_FLIGHTS)).toEqual([])
  })

  it('S1: delaying AU101 by 45 min creates exactly one conflict, A3 AU101/DW220', () => {
    expect(detectConflicts(afterS1())).toEqual([
      { gateId: 'A3', flightIds: [flight('AU101').id, flight('DW220').id] },
    ])
  })

  it('ignores cancelled and departed flights', () => {
    const flights = afterS1().map((f) => (f.flightNumber === 'DW220' ? { ...f, status: 'CANCELLED' as const, gateId: null } : f))
    expect(detectConflicts(flights)).toEqual([])
  })
})

describe('validateAssignment / assignGate (BR-15…BR-18, US-006)', () => {
  it('S2: for delayed AU101, A4 conflicts with AU115, B6 is closed, A5 is free (TC-08)', () => {
    const flights = afterS1()
    const au101 = flight('AU101', flights)
    expect(validateAssignment(au101, gate('A4'), flights)).toBe('Conflicts with AU115 12:15–13:15')
    expect(validateAssignment(au101, gate('B6'), flights)).toBe('Gate closed (Maintenance)')
    expect(validateAssignment(au101, gate('A3'), flights)).toBe('Already assigned to this gate')
    expect(validateAssignment(au101, gate('A5'), flights)).toBeNull()
  })

  it('S2: reassigning AU101 to A5 removes the conflict; A3 and A5 become RESERVED (TC-09)', () => {
    const flights = afterS1()
    const result = expectOk(assignGate(flight('AU101', flights), gate('A5'), flights))
    expect(result.fromGateId).toBe('A3')
    const after = replace(flights, result.flight)
    expect(detectConflicts(after)).toEqual([])
    expect(getGateState(gate('A5'), after, SIM_NOW)).toBe('RESERVED')
    expect(getGateState(gate('A3'), after, SIM_NOW)).toBe('RESERVED')
  })

  it('refuses a conflicting assignment and returns the reason (US-006 AC3)', () => {
    const flights = afterS1()
    const result = assignGate(flight('AU101', flights), gate('A4'), flights)
    expect(result).toEqual({ ok: false, reason: 'Conflicts with AU115 12:15–13:15' })
  })

  it('S5: assigns gate-less LW330 to B3', () => {
    const result = expectOk(assignGate(flight('LW330'), gate('B3'), SEED_FLIGHTS))
    expect(result.flight.gateId).toBe('B3')
    expect(result.fromGateId).toBeNull()
  })

  it('refuses final flights and wide-body aircraft on NARROW gates', () => {
    expect(validateAssignment(flight('AU100'), gate('A5'), SEED_FLIGHTS)).toMatch(/final status/)
    const widebody = SEED_FLIGHTS.find((f) => f.aircraftTypeCode === 'B789' && f.status === 'SCHEDULED')!
    expect(validateAssignment(widebody, gate('B3'), SEED_FLIGHTS)).toBe('Wide-body aircraft needs a WIDE gate')
  })

  it('does not count a flight as conflicting with itself', () => {
    const lw330 = { ...flight('LW330'), gateId: null }
    expect(validateAssignment(lw330, gate('B3'), SEED_FLIGHTS)).toBeNull()
  })
})

describe('closeGate / reopenGate (BR-19…BR-21, US-009)', () => {
  it('S4: closing A4 removes the gate from its active flights only (US-009 AC2, AC3)', () => {
    const onA4 = SEED_FLIGHTS.filter((f) => f.gateId === 'A4')
    const activeOnA4 = onA4.filter((f) => ['SCHEDULED', 'DELAYED', 'BOARDING'].includes(f.status))
    const result = expectOk(closeGate(gate('A4'), SEED_FLIGHTS, 'Equipment failure'))

    expect(result.gate).toMatchObject({ isClosed: true, closedReason: 'Equipment failure' })
    expect(result.affectedFlightIds).toEqual(activeOnA4.map((f) => f.id))
    expect(result.affectedFlightIds).toContain(flight('AU115').id)
    for (const f of onA4) {
      const after = result.flights.find((x) => x.id === f.id)!
      expect(after.gateId, f.flightNumber).toBe(activeOnA4.includes(f) ? null : 'A4')
    }

    const gates = SEED_GATES.map((g) => (g.id === 'A4' ? result.gate : g))
    const active = gates.filter((g) => getGateState(g, result.flights, SIM_NOW) !== 'UNAVAILABLE')
    expect(active).toHaveLength(10)
    const required = getGateRequired(result.flights).map((r) => r.flight.id)
    for (const id of result.affectedFlightIds) expect(required).toContain(id)
  })

  it('refuses closing a closed gate or an unknown reason, and reopens', () => {
    expect(closeGate(gate('B6'), SEED_FLIGHTS, 'Security').ok).toBe(false)
    // @ts-expect-error — invalid reason on purpose
    expect(closeGate(gate('A1'), SEED_FLIGHTS, 'Party').ok).toBe(false)
    expect(expectOk(reopenGate(gate('B6'))).gate).toMatchObject({ isClosed: false, closedReason: null })
    expect(reopenGate(gate('A1')).ok).toBe(false)
  })

  it('affects only active flights: landed flights on A5 keep their gate', () => {
    const result = expectOk(closeGate(gate('A5'), SEED_FLIGHTS, 'Cleaning'))
    const activeOnA5 = getGateAssignments('A5', SEED_FLIGHTS).filter((f) => f.status !== 'LANDED')
    expect(result.affectedFlightIds).toEqual(activeOnA5.map((f) => f.id))
  })

  it('a gate without flights affects nobody', () => {
    const flights = SEED_FLIGHTS.filter((f) => f.gateId !== 'A5')
    expect(expectOk(closeGate(gate('A5'), flights, 'Cleaning')).affectedFlightIds).toEqual([])
  })
})

describe('getGateRequired (FR-027)', () => {
  it('seed: only LW330 needs a gate', () => {
    expect(getGateRequired(SEED_FLIGHTS).map((r) => [r.flight.flightNumber, r.problem])).toEqual([['LW330', 'NO_GATE']])
  })

  it('after S1 both conflicting flights are listed, ordered by time', () => {
    expect(getGateRequired(afterS1()).map((r) => [r.flight.flightNumber, r.problem])).toEqual([
      ['LW330', 'NO_GATE'],
      ['AU101', 'CONFLICT'],
      ['DW220', 'CONFLICT'],
    ])
  })
})
