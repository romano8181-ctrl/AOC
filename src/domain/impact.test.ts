import { describe, expect, it } from 'vitest'
import { SEED_FLIGHTS, SEED_GATES } from '@/data/seed'
import { previewDelay, previewGateClosure } from './impact'
import { SIM_NOW, fromHHMM } from './time'

const id = (n: string) => SEED_FLIGHTS.find((f) => f.flightNumber === n)!.id

describe('previewDelay (US-007 AC2)', () => {
  it('AU101 +45: new time, window, the DW220 conflict and the KPI change — without changing data', () => {
    const before = JSON.stringify(SEED_FLIGHTS)
    const result = previewDelay(SEED_FLIGHTS, SEED_GATES, SIM_NOW, id('AU101'), 45)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const p = result.value
    expect(p.flight.estimatedTime).toBe(fromHHMM('13:15'))
    expect(p.window).toEqual({ start: fromHHMM('12:30'), end: fromHHMM('13:30') })
    expect(p.newConflicts.map((c) => [c.gateId, c.other.flightNumber])).toEqual([['A3', 'DW220']])
    expect([p.kpiBefore.onTime, p.kpiAfter.onTime]).toEqual([39, 38])
    expect([p.kpiBefore.delayed, p.kpiAfter.delayed]).toEqual([7, 8])
    expect([p.kpiBefore.avgDelayMinutes, p.kpiAfter.avgDelayMinutes]).toEqual([38, 39])
    expect([p.kpiBefore.otpPercent, p.kpiAfter.otpPercent]).toEqual([84.8, 82.6])
    expect(JSON.stringify(SEED_FLIGHTS)).toBe(before)
  })

  it('a small delay that stays clear of other flights reports no conflict', () => {
    const result = previewDelay(SEED_FLIGHTS, SEED_GATES, SIM_NOW, id('AU101'), 15)
    expect(result.ok && result.value.newConflicts).toEqual([])
  })

  it('a flight without a gate has no window', () => {
    const result = previewDelay(SEED_FLIGHTS, SEED_GATES, SIM_NOW, id('LW330'), 30)
    expect(result.ok && result.value.window).toBeNull()
  })

  it('returns the domain reason for invalid input', () => {
    expect(previewDelay(SEED_FLIGHTS, SEED_GATES, SIM_NOW, id('AU101'), 10)).toEqual({
      ok: false,
      reason: 'Delay must be 15–360 minutes.',
    })
    expect(previewDelay(SEED_FLIGHTS, SEED_GATES, SIM_NOW, '', 45).ok).toBe(false)
  })
})

describe('previewGateClosure (US-009 AC1)', () => {
  it('A4: AU115, AU112 and BX506 lose the gate; active gates 11 → 10', () => {
    const result = previewGateClosure(SEED_FLIGHTS, SEED_GATES, SIM_NOW, 'A4')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.affected.map((f) => f.flightNumber)).toEqual(['AU115', 'AU112', 'BX506'])
    expect([result.value.kpiBefore.activeGates, result.value.kpiAfter.activeGates]).toEqual([11, 10])
  })

  it('a closed gate or unknown gate fails', () => {
    expect(previewGateClosure(SEED_FLIGHTS, SEED_GATES, SIM_NOW, 'B6').ok).toBe(false)
    expect(previewGateClosure(SEED_FLIGHTS, SEED_GATES, SIM_NOW, '').ok).toBe(false)
  })
})
