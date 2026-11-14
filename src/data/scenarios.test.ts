import { describe, expect, it } from 'vitest'
import type { Flight, Gate, Result } from '@/domain/types'
import { SIM_NOW, fromHHMM } from '@/domain/time'
import { applyDelay, cancelFlight } from '@/domain/flightRules'
import { assignGate, closeGate, detectConflicts, getGateRequired, getGateState } from '@/domain/gateRules'
import { computeAnalytics, computeKpis } from '@/domain/kpi'
import { SEED_FLIGHTS, SEED_GATES } from './seed'

// Seed KPIs (PRD 13.2) and the demo scenarios S1–S5 (PRD 13.4), run through the real domain rules.

const byNumber = (n: string, flights: Flight[] = SEED_FLIGHTS) => flights.find((f) => f.flightNumber === n)!

function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(result.reason)
  return result.value
}
const replace = (flights: Flight[], updated: Flight) => flights.map((f) => (f.id === updated.id ? updated : f))
const gateById = (id: string, gates: Gate[] = SEED_GATES) => gates.find((g) => g.id === id)!
const kpisOf = (flights: Flight[], gates: Gate[] = SEED_GATES) => computeKpis(flights, gates, SIM_NOW)

describe('seed KPIs (PRD 13.2, US-001 AC1, US-011 AC1)', () => {
  const k = kpisOf(SEED_FLIGHTS)

  it('matches the expected KPI table', () => {
    expect(k).toEqual({
      total: 48,
      arrivals: 24,
      departures: 24,
      onTime: 39,
      delayed: 7,
      cancelled: 2,
      activeGates: 11,
      totalGates: 12,
      avgDelayMinutes: 38, // 265 / 7 = 37.9
      otpPercent: 84.8, // 39 / 46
    })
  })

  it('has 1 alert (LW330 needs a gate) and 0 conflicts', () => {
    expect(detectConflicts(SEED_FLIGHTS)).toEqual([])
    expect(getGateRequired(SEED_FLIGHTS).map((r) => r.flight.flightNumber)).toEqual(['LW330'])
  })

  it('Analytics shows the same numbers as Overview (US-011 AC2)', () => {
    const a = computeAnalytics(SEED_FLIGHTS, SEED_GATES, SIM_NOW)
    expect(a.otpPercent).toBe(k.otpPercent)
    expect(a.avgDelayMinutes).toBe(k.avgDelayMinutes)
    expect(a.cancelled).toBe(k.cancelled)
    expect(a.cancelledPercent).toBe(4.2)
  })
})

describe('demo scenarios (PRD 13.4)', () => {
  const s1 = () => replace(SEED_FLIGHTS, unwrap(applyDelay(byNumber('AU101'), 45, 'Weather')).flight)

  it('S1: AU101 +45 Weather → conflict on A3, On-time 38, Delayed 8, Avg 39', () => {
    const flights = s1()
    expect(byNumber('AU101', flights)).toMatchObject({ status: 'DELAYED', estimatedTime: fromHHMM('13:15') })
    expect(detectConflicts(flights)).toHaveLength(1)
    expect(kpisOf(flights)).toMatchObject({ onTime: 38, delayed: 8, avgDelayMinutes: 39, otpPercent: 82.6 })
  })

  it('S2 (after S1): AU101 → A5 removes the conflict; A5 and A3 are RESERVED', () => {
    const before = s1()
    expect(assignGate(byNumber('AU101', before), gateById('A4'), before).ok).toBe(false)
    const flights = replace(before, unwrap(assignGate(byNumber('AU101', before), gateById('A5'), before)).flight)
    expect(detectConflicts(flights)).toEqual([])
    expect(getGateState(gateById('A5'), flights, SIM_NOW)).toBe('RESERVED')
    expect(getGateState(gateById('A3'), flights, SIM_NOW)).toBe('RESERVED')
    expect(kpisOf(flights)).toMatchObject({ onTime: 38, delayed: 8 })
  })

  it('S3: cancel NS455 → Cancelled 3, OTP 84.4%, B2 released', () => {
    const { flight, previousGateId } = unwrap(cancelFlight(byNumber('NS455'), 'Technical'))
    const flights = replace(SEED_FLIGHTS, flight)
    expect(previousGateId).toBe('B2')
    expect(kpisOf(flights)).toMatchObject({ cancelled: 3, onTime: 38, otpPercent: 84.4 })
    const util = (fl: Flight[]) => computeAnalytics(fl, SEED_GATES, SIM_NOW).gateUtilization.find((g) => g.gateId === 'B2')!
    expect(util(SEED_FLIGHTS).minutes - util(flights).minutes).toBe(60)
  })

  it('S4: close A4 → AU115 needs a gate, Active gates 10/12', () => {
    const result = unwrap(closeGate(gateById('A4'), SEED_FLIGHTS, 'Equipment failure'))
    const gates = SEED_GATES.map((g) => (g.id === 'A4' ? result.gate : g))
    expect(kpisOf(result.flights, gates)).toMatchObject({ activeGates: 10, totalGates: 12 })
    expect(getGateRequired(result.flights).map((r) => r.flight.flightNumber)).toContain('AU115')
  })

  it('S5: assign LW330 → B3 clears the "gate required" alert', () => {
    const flights = replace(SEED_FLIGHTS, unwrap(assignGate(byNumber('LW330'), gateById('B3'), SEED_FLIGHTS)).flight)
    expect(getGateRequired(flights)).toEqual([])
  })

  it('keeps onTime + delayed + cancelled = total in every scenario state', () => {
    for (const flights of [SEED_FLIGHTS, s1()]) {
      const k = kpisOf(flights)
      expect(k.onTime + k.delayed + k.cancelled).toBe(k.total)
    }
  })
})
