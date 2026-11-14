import { describe, expect, it } from 'vitest'
import {
  computeAnalytics,
  computeGateUtilization,
  computeKpis,
  isDelayedKpi,
  isOnTime,
} from './kpi'
import { SIM_NOW, fromHHMM } from './time'
import type { Flight, Gate } from './types'

const t = (hhmm: string) => fromHHMM(hhmm)!

let seq = 0
function makeFlight(overrides: Partial<Flight> = {}): Flight {
  seq += 1
  return {
    id: `F-K${seq}`,
    flightNumber: `AU${100 + seq}`,
    airlineCode: 'AU',
    type: 'DEPARTURE',
    origin: 'AUR Aurora',
    destination: 'WAW Warsaw',
    scheduledTime: t('14:00'),
    estimatedTime: t('14:00'),
    actualTime: null,
    status: 'SCHEDULED',
    gateId: 'A1',
    aircraftTypeCode: 'A320',
    delayReason: null,
    cancelReason: null,
    ...overrides,
  }
}

const delayedBy = (minutes: number, overrides: Partial<Flight> = {}) =>
  makeFlight({ estimatedTime: t('14:00') + minutes, status: 'DELAYED', ...overrides })

const GATES: Gate[] = [
  { id: 'A1', terminal: 'A', sizeCategory: 'WIDE', isClosed: false, closedReason: null },
  { id: 'B6', terminal: 'B', sizeCategory: 'NARROW', isClosed: true, closedReason: 'Maintenance' },
]

describe('isOnTime / isDelayedKpi (A15 threshold)', () => {
  it('14 min late is on time, 15 min late is delayed', () => {
    expect(isOnTime(delayedBy(14))).toBe(true)
    expect(isDelayedKpi(delayedBy(14))).toBe(false)
    expect(isOnTime(delayedBy(15))).toBe(false)
    expect(isDelayedKpi(delayedBy(15))).toBe(true)
  })

  it('a completed late flight counts as delayed (unlike the DELAYED status)', () => {
    const late = makeFlight({ status: 'DEPARTED', estimatedTime: t('14:20'), actualTime: t('14:20') })
    expect(isDelayedKpi(late)).toBe(true)
  })

  it('cancelled flights are neither on time nor delayed', () => {
    const cancelled = makeFlight({ status: 'CANCELLED', gateId: null })
    expect(isOnTime(cancelled)).toBe(false)
    expect(isDelayedKpi(cancelled)).toBe(false)
  })
})

describe('computeKpis', () => {
  it('counts every KPI and keeps onTime + delayed + cancelled = total', () => {
    const flights = [
      makeFlight(),
      makeFlight({ type: 'ARRIVAL' }),
      delayedBy(20),
      delayedBy(41),
      makeFlight({ status: 'CANCELLED', gateId: null }),
    ]
    const k = computeKpis(flights, GATES, SIM_NOW)
    expect(k).toMatchObject({ total: 5, arrivals: 1, departures: 4, onTime: 2, delayed: 2, cancelled: 1 })
    expect(k.onTime + k.delayed + k.cancelled).toBe(k.total)
    expect(k.avgDelayMinutes).toBe(31) // (20 + 41) / 2 = 30.5 → 31
    expect(k.otpPercent).toBe(50) // 2 / 4
    expect(k.activeGates).toBe(1)
    expect(k.totalGates).toBe(2)
  })

  it('average delay ignores on-time flights and is 0 without delays', () => {
    expect(computeKpis([makeFlight(), delayedBy(10)], GATES, SIM_NOW).avgDelayMinutes).toBe(0)
  })

  it('OTP is null when every flight is cancelled, and rounds to one decimal', () => {
    expect(computeKpis([makeFlight({ status: 'CANCELLED', gateId: null })], GATES, SIM_NOW).otpPercent).toBeNull()
    const two = [makeFlight(), makeFlight(), delayedBy(30)]
    expect(computeKpis(two, GATES, SIM_NOW).otpPercent).toBe(66.7)
  })

  it('handles an empty day', () => {
    const k = computeKpis([], GATES, SIM_NOW)
    expect(k).toMatchObject({ total: 0, onTime: 0, delayed: 0, cancelled: 0, avgDelayMinutes: 0, otpPercent: null })
  })
})

describe('computeGateUtilization (FR-040)', () => {
  it('sums window minutes per gate and divides by 960', () => {
    const flights = [makeFlight(), makeFlight({ type: 'ARRIVAL', estimatedTime: t('16:00') })]
    const [a1, b6] = computeGateUtilization(flights, GATES)
    expect(a1).toEqual({ gateId: 'A1', minutes: 120, percent: 12.5 })
    expect(b6).toEqual({ gateId: 'B6', minutes: 0, percent: 0 })
  })

  it('clips windows to 06:00–22:00 and ignores cancelled flights', () => {
    const early = makeFlight({ estimatedTime: t('06:00'), scheduledTime: t('06:00') }) // 05:15–06:15 → 15 min
    const cancelled = makeFlight({ status: 'CANCELLED', gateId: 'A1' })
    expect(computeGateUtilization([early, cancelled], GATES)[0].minutes).toBe(15)
  })
})

describe('computeAnalytics', () => {
  const flights = [
    makeFlight({ scheduledTime: t('06:10'), estimatedTime: t('06:10') }),
    makeFlight({ type: 'ARRIVAL', scheduledTime: t('06:40'), estimatedTime: t('06:40') }),
    delayedBy(30, { airlineCode: 'DW', flightNumber: 'DW900' }),
    makeFlight({ status: 'CANCELLED', gateId: null }),
  ]
  const a = computeAnalytics(flights, GATES, SIM_NOW)

  it('mirrors the KPI numbers', () => {
    const k = computeKpis(flights, GATES, SIM_NOW)
    expect(a.otpPercent).toBe(k.otpPercent)
    expect(a.avgDelayMinutes).toBe(k.avgDelayMinutes)
    expect(a.cancelled).toBe(k.cancelled)
    expect(a.cancelledPercent).toBe(25)
  })

  it('lists every status in a fixed order, including zero counts', () => {
    expect(a.statusDistribution.map((s) => s.status)).toEqual([
      'SCHEDULED', 'BOARDING', 'DELAYED', 'DEPARTED', 'LANDED', 'CANCELLED',
    ])
    expect(a.statusDistribution.find((s) => s.status === 'BOARDING')!.count).toBe(0)
    expect(a.statusDistribution.reduce((sum, s) => sum + s.count, 0)).toBe(flights.length)
  })

  it('groups movements by scheduled hour 06–21', () => {
    expect(a.movementsByHour).toHaveLength(16)
    expect(a.movementsByHour[0]).toEqual({ hour: 6, arrivals: 1, departures: 1 })
  })

  it('computes average delay per airline', () => {
    expect(a.avgDelayByAirline.find((x) => x.airlineCode === 'DW')).toMatchObject({ avgDelayMinutes: 30, delayedFlights: 1 })
    expect(a.avgDelayByAirline.find((x) => x.airlineCode === 'AU')).toMatchObject({ avgDelayMinutes: 0, delayedFlights: 0 })
  })
})
