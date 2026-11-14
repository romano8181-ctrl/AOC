import { describe, expect, it } from 'vitest'
import type { StorageValue } from 'zustand/middleware'
import { SEED_FLIGHTS } from '@/data/seed'
import {
  INVALID_STATE_WARNING,
  STORAGE_VERSION,
  createSafeStorage,
  createSeedData,
  isValidData,
  parsePersisted,
  type PersistedShape,
  type StorageBackend,
} from './persistence'

function memoryBackend(initial: Record<string, string> = {}): StorageBackend & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  }
}

const valid = () => JSON.stringify({ state: createSeedData(), version: STORAGE_VERSION })

describe('createSeedData', () => {
  it('returns a fresh copy that does not share objects with the seed', () => {
    const data = createSeedData()
    data.flights[0].status = 'CANCELLED'
    expect(SEED_FLIGHTS[0].status).not.toBe('CANCELLED')
    expect(data.events).toEqual([])
    expect(isValidData(createSeedData())).toBe(true)
  })
})

describe('parsePersisted (US-012 AC3, TC-17)', () => {
  it('nothing saved → empty', () => {
    expect(parsePersisted(null)).toEqual({ kind: 'empty' })
  })

  it('valid saved state → ok', () => {
    const parsed = parsePersisted(valid())
    expect(parsed.kind).toBe('ok')
  })

  it.each([
    ['broken JSON', '{bad'],
    ['wrong version', JSON.stringify({ state: createSeedData(), version: 99 })],
    ['missing arrays', JSON.stringify({ state: { flights: 'x' }, version: STORAGE_VERSION })],
    ['not an object', '42'],
    ['flights without ids', JSON.stringify({ state: { ...createSeedData(), flights: [{}] }, version: STORAGE_VERSION })],
  ])('%s → invalid', (_label, raw) => {
    expect(parsePersisted(raw)).toEqual({ kind: 'invalid' })
  })
})

describe('createSafeStorage', () => {
  it('round-trips saved data without the UI-only warning', () => {
    const backend = memoryBackend()
    const storage = createSafeStorage(backend)
    const state = { ...createSeedData(), storageWarning: 'should not be saved' }
    storage.setItem('k', { state, version: STORAGE_VERSION })
    expect(backend.data.get('k')).not.toContain('should not be saved')
    expect(storage.getItem('k')).toEqual({ state: { ...createSeedData(), storageWarning: null }, version: STORAGE_VERSION })
  })

  it('invalid saved data → seed + warning, and the bad entry is removed', () => {
    const backend = memoryBackend({ k: '{bad' })
    const restored = createSafeStorage(backend).getItem('k')
    expect(restored).not.toBeNull()
    expect(restored).not.toBeInstanceOf(Promise)
    const value = restored as StorageValue<PersistedShape>
    expect(value.state.storageWarning).toBe(INVALID_STATE_WARNING)
    expect(value.state.flights).toHaveLength(48)
    expect(backend.data.has('k')).toBe(false)
  })

  it('keeps working when the storage throws (blocked or full)', () => {
    const throwing: StorageBackend = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('full')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    }
    const storage = createSafeStorage(throwing)
    expect(storage.getItem('k')).toBeNull()
    expect(() => storage.setItem('k', { state: { ...createSeedData(), storageWarning: null }, version: 1 })).not.toThrow()
    expect(() => storage.removeItem('k')).not.toThrow()
  })
})
