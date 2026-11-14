import { describe, expect, it } from 'vitest'
import { SEED_FLIGHTS, SEED_GATES } from '@/data/seed'
import {
  DEFAULT_QUERY,
  hasActiveFilters,
  matchesSearch,
  normalizeSearch,
  queryFlights,
  type FlightQuery,
} from './flightQuery'
import { computeKpis } from './kpi'
import { SIM_NOW } from './time'

const q = (overrides: Partial<FlightQuery>): FlightQuery => ({ ...DEFAULT_QUERY, ...overrides })
const numbers = (query: Partial<FlightQuery>) => queryFlights(SEED_FLIGHTS, q(query)).map((f) => f.flightNumber)

describe('search (FR-012, TC-02, TC-04)', () => {
  it('is case-insensitive and ignores surrounding spaces', () => {
    const result = numbers({ search: '  au1 ' })
    expect(result.length).toBeGreaterThan(0)
    for (const n of result) expect(n.startsWith('AU1')).toBe(true)
    expect(result).toContain('AU101')
  })

  it('matches the city in origin or destination', () => {
    const result = queryFlights(SEED_FLIGHTS, q({ search: 'warsaw' }))
    expect(result.map((f) => f.flightNumber).sort()).toEqual(['AU101', 'AU102', 'AU120'])
  })

  it('returns nothing for an unknown flight (empty state)', () => {
    expect(numbers({ search: 'ZZZ999' })).toEqual([])
  })

  it('truncates very long input to 50 characters', () => {
    expect(normalizeSearch('x'.repeat(80))).toHaveLength(50)
    expect(matchesSearch(SEED_FLIGHTS[0], '   ')).toBe(true)
  })
})

describe('filters combine with AND (FR-013, TC-03)', () => {
  it('Status = Delayed + Departures + Aurora Air', () => {
    const result = queryFlights(SEED_FLIGHTS, q({ statuses: ['DELAYED'], type: 'DEPARTURE', airline: 'AU' }))
    for (const f of result) expect([f.status, f.type, f.airlineCode]).toEqual(['DELAYED', 'DEPARTURE', 'AU'])
  })

  it('multiple statuses are OR within the status filter', () => {
    const result = queryFlights(SEED_FLIGHTS, q({ statuses: ['CANCELLED', 'BOARDING'] }))
    expect(result).toHaveLength(4)
  })

  it('"Delayed ≥ 15 min" shows exactly the KPI Delayed count (7), unlike Status = Delayed (5)', () => {
    const kpiDelayed = computeKpis(SEED_FLIGHTS, SEED_GATES, SIM_NOW).delayed
    expect(numbers({ delayedOnly: true })).toHaveLength(kpiDelayed)
    expect(kpiDelayed).toBe(7)
    expect(numbers({ statuses: ['DELAYED'] })).toHaveLength(5)
  })

  it('Arrivals only → 24 rows', () => {
    expect(numbers({ type: 'ARRIVAL' })).toHaveLength(24)
  })
})

describe('sorting (FR-014, TC-05)', () => {
  it('default: scheduled ascending', () => {
    const result = queryFlights(SEED_FLIGHTS, DEFAULT_QUERY)
    expect(result[0].flightNumber).toBe('AU100')
    expect(result.at(-1)!.flightNumber).toBe('NS408')
  })

  it('scheduled descending puts the latest flight first', () => {
    expect(numbers({ sortDir: 'desc' })[0]).toBe('NS408')
  })

  it('estimated sort follows delays', () => {
    const result = queryFlights(SEED_FLIGHTS, q({ sortBy: 'estimated', sortDir: 'desc' }))
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].estimatedTime).toBeGreaterThanOrEqual(result[i].estimatedTime)
    }
  })

  it('does not mutate the input array', () => {
    const before = SEED_FLIGHTS.map((f) => f.id)
    queryFlights(SEED_FLIGHTS, q({ sortDir: 'desc' }))
    expect(SEED_FLIGHTS.map((f) => f.id)).toEqual(before)
  })
})

describe('hasActiveFilters', () => {
  it('is false for the default view and ignores sorting and blank search', () => {
    expect(hasActiveFilters(DEFAULT_QUERY)).toBe(false)
    expect(hasActiveFilters(q({ sortDir: 'desc', search: '  ' }))).toBe(false)
    expect(hasActiveFilters(q({ delayedOnly: true }))).toBe(true)
    expect(hasActiveFilters(q({ airline: 'MA' }))).toBe(true)
  })
})
