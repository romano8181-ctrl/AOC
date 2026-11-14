import { isDelayedKpi } from './kpi'
import type { Flight, FlightStatus, FlightType } from './types'

// Search, filters and sorting for the Flights table (FR-012…FR-015). Pure and tested,
// so the table and the KPI "Delayed" count use the same definition.

export const SEARCH_MAX_LENGTH = 50

export type SortField = 'scheduled' | 'estimated'
export type SortDirection = 'asc' | 'desc'

export interface FlightQuery {
  search: string
  /** Empty = all statuses. */
  statuses: FlightStatus[]
  /** Airline code or 'ALL'. */
  airline: string
  type: FlightType | 'ALL'
  /** Same set as the KPI "Delayed" card: not cancelled and ≥ 15 min late (FR-013). */
  delayedOnly: boolean
  sortBy: SortField
  sortDir: SortDirection
}

export const DEFAULT_QUERY: FlightQuery = {
  search: '',
  statuses: [],
  airline: 'ALL',
  type: 'ALL',
  delayedOnly: false,
  sortBy: 'scheduled',
  sortDir: 'asc',
}

/** Trimmed, lower-cased, max 50 characters (US-003 edge cases). */
export function normalizeSearch(text: string): string {
  return text.trim().slice(0, SEARCH_MAX_LENGTH).toLowerCase()
}

/** FR-012: case-insensitive match on flight number, origin or destination. */
export function matchesSearch(flight: Flight, search: string): boolean {
  const q = normalizeSearch(search)
  if (q === '') return true
  return [flight.flightNumber, flight.origin, flight.destination].some((field) => field.toLowerCase().includes(q))
}

/** FR-013: all filters combine with AND. */
export function matchesFilters(flight: Flight, query: FlightQuery): boolean {
  return (
    matchesSearch(flight, query.search) &&
    (query.statuses.length === 0 || query.statuses.includes(flight.status)) &&
    (query.airline === 'ALL' || flight.airlineCode === query.airline) &&
    (query.type === 'ALL' || flight.type === query.type) &&
    (!query.delayedOnly || isDelayedKpi(flight))
  )
}

/** FR-014: by scheduled or estimated time; ties broken by flight number for a stable order. */
export function sortFlights(flights: Flight[], sortBy: SortField, sortDir: SortDirection): Flight[] {
  const key = (f: Flight) => (sortBy === 'scheduled' ? f.scheduledTime : f.estimatedTime)
  const dir = sortDir === 'asc' ? 1 : -1
  return [...flights].sort((a, b) => (key(a) - key(b)) * dir || a.flightNumber.localeCompare(b.flightNumber))
}

export function queryFlights(flights: Flight[], query: FlightQuery): Flight[] {
  return sortFlights(
    flights.filter((f) => matchesFilters(f, query)),
    query.sortBy,
    query.sortDir,
  )
}

/** True when anything differs from the default view (shows "Clear filters"). */
export function hasActiveFilters(query: FlightQuery): boolean {
  return (
    normalizeSearch(query.search) !== '' ||
    query.statuses.length > 0 ||
    query.airline !== 'ALL' ||
    query.type !== 'ALL' ||
    query.delayedOnly
  )
}
