import type { AircraftType, Airline, Airport } from '@/domain/types'

// Static reference data (PRD 10, 13.1). Not part of the store: never changes at runtime.
// Airport and airlines are fictional and always labelled as simulated.

export const AIRPORT: Airport = {
  code: 'AUR',
  name: 'Aurora International (simulated)',
  city: 'Aurora',
  isSimulated: true,
}

export const AIRLINES: Airline[] = [
  { code: 'AU', name: 'Aurora Air', color: '#38bdf8' },
  { code: 'DW', name: 'Dnipro Wings', color: '#fbbf24' },
  { code: 'LW', name: 'Lumen Airways', color: '#a78bfa' },
  { code: 'NS', name: 'Nordic Sky', color: '#2dd4bf' },
  { code: 'BX', name: 'Baltic Express', color: '#fb7185' },
  { code: 'MA', name: 'Meridian Atlantic', color: '#4ade80' },
]

export const AIRCRAFT_TYPES: AircraftType[] = [
  { code: 'A320', name: 'Airbus A320', sizeCategory: 'NARROW' },
  { code: 'A321', name: 'Airbus A321', sizeCategory: 'NARROW' },
  { code: 'B738', name: 'Boeing 737-800', sizeCategory: 'NARROW' },
  { code: 'E195', name: 'Embraer E195', sizeCategory: 'NARROW' },
  { code: 'B789', name: 'Boeing 787-9', sizeCategory: 'WIDE' },
]

const AIRLINE_BY_CODE = new Map(AIRLINES.map((a) => [a.code, a]))
const AIRCRAFT_BY_CODE = new Map(AIRCRAFT_TYPES.map((a) => [a.code, a]))

export function getAirline(code: string): Airline | undefined {
  return AIRLINE_BY_CODE.get(code)
}

export function getAircraftType(code: string): AircraftType | undefined {
  return AIRCRAFT_BY_CODE.get(code)
}
