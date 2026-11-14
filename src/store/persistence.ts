import type { PersistStorage, StorageValue } from 'zustand/middleware'
import { SEED_FLIGHTS, SEED_GATES } from '@/data/seed'
import { SIM_NOW } from '@/domain/time'
import type { Flight, Gate, Minutes, OperationalEvent } from '@/domain/types'

// Safe localStorage persistence (FR-046, US-012, NFR-005, PRD 13.6).
// Invalid or outdated saved data never crashes the app: it falls back to the seed with a warning.

export const STORAGE_KEY = 'aoc-state-v1'
export const STORAGE_VERSION = 1
export const INVALID_STATE_WARNING = 'Saved state was invalid — demo data restored.'

/** The part of the store that is saved. */
export interface AocData {
  flights: Flight[]
  gates: Gate[]
  events: OperationalEvent[]
  simNow: Minutes
}

/** Fresh copy of the original scenario (never shares objects with SEED_*). */
export function createSeedData(): AocData {
  return {
    flights: structuredClone(SEED_FLIGHTS),
    gates: structuredClone(SEED_GATES),
    events: [],
    simNow: SIM_NOW,
  }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

/** Lightweight shape check: enough to catch corrupted or foreign data. */
export function isValidData(value: unknown): value is AocData {
  if (!isObject(value)) return false
  const { flights, gates, events, simNow } = value
  return (
    Array.isArray(flights) &&
    flights.every((f) => isObject(f) && typeof f.id === 'string' && typeof f.status === 'string') &&
    Array.isArray(gates) &&
    gates.every((g) => isObject(g) && typeof g.id === 'string' && typeof g.isClosed === 'boolean') &&
    Array.isArray(events) &&
    typeof simNow === 'number'
  )
}

export type ParsedState =
  | { kind: 'empty' }
  | { kind: 'ok'; data: AocData }
  | { kind: 'invalid' }

/** Raw localStorage string → what to start with. Pure, so it is unit-tested directly. */
export function parsePersisted(raw: string | null): ParsedState {
  if (raw === null) return { kind: 'empty' }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isObject(parsed) || parsed.version !== STORAGE_VERSION || !isValidData(parsed.state)) {
      return { kind: 'invalid' }
    }
    return { kind: 'ok', data: parsed.state }
  } catch {
    return { kind: 'invalid' }
  }
}

/** Persisted state plus a one-off warning the UI shows as a toast. */
export type PersistedShape = AocData & { storageWarning: string | null }

export type StorageBackend = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/** localStorage when available (browser), otherwise an in-memory map (tests, blocked storage). */
function getBackend(): StorageBackend {
  try {
    const ls = globalThis.localStorage
    const probe = '__aoc_probe__'
    ls.setItem(probe, '1')
    ls.removeItem(probe)
    return ls
  } catch {
    const memory = new Map<string, string>()
    return {
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => void memory.set(k, v),
      removeItem: (k) => void memory.delete(k),
    }
  }
}

export function createSafeStorage(backend: StorageBackend = getBackend()): PersistStorage<PersistedShape> {
  return {
    getItem: (name): StorageValue<PersistedShape> | null => {
      let raw: string | null = null
      try {
        raw = backend.getItem(name)
      } catch {
        return null
      }
      const parsed = parsePersisted(raw)
      if (parsed.kind === 'empty') return null
      if (parsed.kind === 'ok') return { state: { ...parsed.data, storageWarning: null }, version: STORAGE_VERSION }
      try {
        backend.removeItem(name)
      } catch {
        // ignore: we fall back to the seed anyway
      }
      return { state: { ...createSeedData(), storageWarning: INVALID_STATE_WARNING }, version: STORAGE_VERSION }
    },
    setItem: (name, value) => {
      try {
        // The warning is UI-only: never written to storage.
        const { flights, gates, events, simNow } = value.state
        const data: AocData = { flights, gates, events, simNow }
        backend.setItem(name, JSON.stringify({ state: data, version: value.version }))
      } catch {
        // Storage full or blocked: keep working in memory (US-012 edge case).
      }
    },
    removeItem: (name) => {
      try {
        backend.removeItem(name)
      } catch {
        // ignore
      }
    },
  }
}
