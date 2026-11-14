import { describe, expect, it } from 'vitest'
import { SEED_FLIGHTS, SEED_GATES } from '@/data/seed'
import { applyDelay } from './flightRules'
import { detectConflicts, getAssignmentOptions, getGateDayPlan, getWindow, summarizeGate } from './gateRules'
import { SIM_NOW } from './time'
import type { Flight } from './types'

const gate = (id: string) => SEED_GATES.find((g) => g.id === id)!
const flight = (n: string, flights: Flight[] = SEED_FLIGHTS) => flights.find((f) => f.flightNumber === n)!
const summary = (id: string, flights: Flight[] = SEED_FLIGHTS) =>
  summarizeGate(gate(id), flights, SIM_NOW, detectConflicts(flights))

describe('summarizeGate (FR-020…FR-022, US-005)', () => {
  it('A3 at 12:00: occupied by AU101, next is DW220, no conflict', () => {
    const s = summary('A3')
    expect(s.state).toBe('OCCUPIED')
    expect(s.current?.flightNumber).toBe('AU101')
    expect(s.next?.flightNumber).toBe('DW220')
    expect(s.hasConflict).toBe(false)
  })

  it('B6 is unavailable with no flights', () => {
    const s = summary('B6')
    expect(s).toMatchObject({ state: 'UNAVAILABLE', current: undefined, next: undefined, flightsToday: 0 })
  })

  it('A5: available, next flight after 14:30', () => {
    const s = summary('A5')
    expect(s.state).toBe('AVAILABLE')
    expect(s.current).toBeUndefined()
    expect(getWindow(s.next!).start).toBeGreaterThanOrEqual(870)
  })

  it('flags the conflict on A3 after the AU101 delay', () => {
    const delayed = applyDelay(flight('AU101'), 45, 'Weather')
    if (!delayed.ok) throw new Error(delayed.reason)
    const flights = SEED_FLIGHTS.map((f) => (f.id === delayed.value.flight.id ? delayed.value.flight : f))
    expect(summary('A3', flights).hasConflict).toBe(true)
    expect(summary('A4', flights).hasConflict).toBe(false)
  })

  it('counts every non-cancelled flight of the day, departed included; 45 in total', () => {
    const total = SEED_GATES.reduce((sum, g) => sum + summary(g.id).flightsToday, 0)
    expect(total).toBe(45) // 48 − 2 cancelled − LW330 without a gate
  })
})

describe('getGateDayPlan', () => {
  it('lists the gate flights in window order, departed included', () => {
    const plan = getGateDayPlan('A3', SEED_FLIGHTS)
    expect(plan.length).toBe(summary('A3').flightsToday)
    for (let i = 1; i < plan.length; i++) {
      expect(getWindow(plan[i - 1]).start).toBeLessThanOrEqual(getWindow(plan[i]).start)
    }
    expect(plan.map((f) => f.flightNumber)).toContain('AU101')
  })
})

describe('getAssignmentOptions (US-006 AC2, TC-08)', () => {
  it('after S1, AU101 can use A5 but not A3 (current), A4 (AU115) or B6 (closed)', () => {
    const delayed = applyDelay(flight('AU101'), 45, 'Weather')
    if (!delayed.ok) throw new Error(delayed.reason)
    const flights = SEED_FLIGHTS.map((f) => (f.id === delayed.value.flight.id ? delayed.value.flight : f))
    const options = getAssignmentOptions(flight('AU101', flights), SEED_GATES, flights)
    const reasonOf = (id: string) => options.find((o) => o.gate.id === id)!.reason

    expect(options).toHaveLength(12)
    expect(reasonOf('A5')).toBeNull()
    expect(reasonOf('A3')).toBe('Already assigned to this gate')
    expect(reasonOf('A4')).toBe('Conflicts with AU115 12:15–13:15')
    expect(reasonOf('B6')).toBe('Gate closed (Maintenance)')
  })

  it('LW330 (no gate) can use B3', () => {
    const options = getAssignmentOptions(flight('LW330'), SEED_GATES, SEED_FLIGHTS)
    expect(options.find((o) => o.gate.id === 'B3')!.reason).toBeNull()
    expect(options.filter((o) => o.reason === null).length).toBeGreaterThan(0)
  })
})
