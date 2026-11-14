import { beforeEach, describe, expect, it } from 'vitest'
import { detectConflicts } from '@/domain/gateRules'
import { fromHHMM } from '@/domain/time'
import type { Flight } from '@/domain/types'
import { createSeedData } from './persistence'
import { getAocData, useAocStore } from './useAocStore'

const store = () => useAocStore.getState()
const flight = (number: string): Flight => store().flights.find((f) => f.flightNumber === number)!
const id = (number: string) => flight(number).id

beforeEach(() => {
  useAocStore.setState({ ...createSeedData(), storageWarning: null })
})

describe('initial state', () => {
  it('starts from the seed with an empty event log (US-010 empty state)', () => {
    expect(store().flights).toHaveLength(48)
    expect(store().gates).toHaveLength(12)
    expect(store().events).toEqual([])
    expect(store().simNow).toBe(fromHHMM('12:00'))
  })
})

describe('applyDelay', () => {
  it('updates the flight, keeps the gate and appends one FLIGHT_DELAYED event', () => {
    const result = store().applyDelay(id('AU101'), 45, 'Weather')
    expect(result.ok).toBe(true)
    expect(flight('AU101')).toMatchObject({ status: 'DELAYED', estimatedTime: fromHHMM('13:15'), gateId: 'A3' })
    expect(store().events).toHaveLength(1)
    expect(store().events[0]).toMatchObject({
      type: 'FLIGHT_DELAYED',
      message: 'AU101 delayed +45 min (Weather)',
      flightId: id('AU101'),
      simTime: fromHHMM('12:00'),
      payload: { minutes: 45, reason: 'Weather' },
    })
    expect(store().events[0].id).toBeTruthy()
    expect(detectConflicts(store().flights)).toHaveLength(1)
  })

  it('a refused delay changes nothing and logs nothing (BR-23)', () => {
    const before = getAocData()
    const result = store().applyDelay(id('AU101'), 10, 'Weather')
    expect(result).toEqual({ ok: false, reason: 'Delay must be 15–360 minutes.' })
    expect(getAocData()).toEqual(before)
  })

  it('unknown flight id fails cleanly', () => {
    expect(store().applyDelay('nope', 30, 'Weather')).toEqual({ ok: false, reason: 'Flight not found.' })
  })
})

describe('cancelFlight', () => {
  it('releases the gate and records the previous gate', () => {
    expect(store().cancelFlight(id('NS455'), 'Technical').ok).toBe(true)
    expect(flight('NS455')).toMatchObject({ status: 'CANCELLED', gateId: null })
    expect(store().events[0]).toMatchObject({
      type: 'FLIGHT_CANCELLED',
      message: 'NS455 cancelled (Technical) — gate B2 released',
      payload: { previousGateId: 'B2' },
    })
  })
})

describe('changeStatus', () => {
  it('blocks boarding for a flight in a gate conflict, allows it after reassignment', () => {
    store().applyDelay(id('AU101'), 45, 'Weather')
    const blocked = store().changeStatus(id('AU101'), 'BOARDING')
    expect(blocked.ok).toBe(false)
    expect(store().events).toHaveLength(1)

    store().assignGate(id('AU101'), 'A5')
    expect(store().changeStatus(id('AU101'), 'BOARDING').ok).toBe(true)
    expect(store().events.at(-1)).toMatchObject({ type: 'STATUS_CHANGED', message: 'AU101 status: Delayed → Boarding' })
  })

  it('DEPARTED sets the actual time', () => {
    const boarding = store().flights.find((f) => f.status === 'BOARDING')!
    expect(store().changeStatus(boarding.id, 'DEPARTED').ok).toBe(true)
    expect(store().flights.find((f) => f.id === boarding.id)!.actualTime).toBe(boarding.estimatedTime)
  })
})

describe('assignGate', () => {
  it('assign → GATE_ASSIGNED, reassign → GATE_REASSIGNED', () => {
    store().assignGate(id('LW330'), 'B3')
    expect(store().events[0]).toMatchObject({ type: 'GATE_ASSIGNED', message: 'LW330 assigned to gate B3' })

    store().applyDelay(id('AU101'), 45, 'Weather')
    store().assignGate(id('AU101'), 'A5')
    expect(store().events.at(-1)).toMatchObject({
      type: 'GATE_REASSIGNED',
      message: 'AU101 moved from gate A3 to A5',
      payload: { fromGateId: 'A3', toGateId: 'A5' },
    })
    expect(detectConflicts(store().flights)).toEqual([])
  })

  it('refuses a conflicting gate without changes (US-006 AC3)', () => {
    store().applyDelay(id('AU101'), 45, 'Weather')
    const before = getAocData()
    expect(store().assignGate(id('AU101'), 'A4')).toEqual({ ok: false, reason: 'Conflicts with AU115 12:15–13:15' })
    expect(getAocData()).toEqual(before)
  })
})

describe('closeGate / reopenGate', () => {
  it('closes A4, unassigns its active flights and logs one event (US-009 AC2)', () => {
    const result = store().closeGate('A4', 'Equipment failure')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(store().gates.find((g) => g.id === 'A4')).toMatchObject({ isClosed: true })
    expect(flight('AU115').gateId).toBeNull()
    expect(store().events).toHaveLength(1)
    expect(store().events[0]).toMatchObject({ type: 'GATE_CLOSED', payload: { affectedFlightIds: result.value.affectedFlightIds } })
    expect(store().events[0].message).toMatch(/^Gate A4 closed \(Equipment failure\) — \d flights? needs? a new gate$/)
  })

  it('reopens B6', () => {
    expect(store().reopenGate('B6').ok).toBe(true)
    expect(store().gates.find((g) => g.id === 'B6')).toMatchObject({ isClosed: false, closedReason: null })
    expect(store().events[0]).toMatchObject({ type: 'GATE_REOPENED' })
  })
})

describe('resetDemo (BR-24, US-012 AC2)', () => {
  it('restores the seed and leaves exactly one DEMO_RESET event', () => {
    store().applyDelay(id('AU101'), 45, 'Weather')
    store().closeGate('A4', 'Security')
    store().resetDemo()
    const seed = createSeedData()
    expect(store().flights).toEqual(seed.flights)
    expect(store().gates).toEqual(seed.gates)
    expect(store().events).toHaveLength(1)
    expect(store().events[0]).toMatchObject({ type: 'DEMO_RESET', message: 'Demo data restored to the original scenario' })
  })

  it('clears a storage warning', () => {
    useAocStore.setState({ storageWarning: 'x' })
    store().resetDemo()
    expect(store().storageWarning).toBeNull()
  })
})
