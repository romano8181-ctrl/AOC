import { describe, expect, it } from 'vitest'
import { SEED_FLIGHTS } from '@/data/seed'
import {
  applyDelay,
  canTransition,
  cancelFlight,
  changeStatus,
  getAllowedTransitions,
  getDelayMinutes,
  isFinal,
  validateDelayMinutes,
} from './flightRules'
import { fromHHMM } from './time'
import type { Flight, Result } from './types'

const t = (hhmm: string) => fromHHMM(hhmm)!

function makeFlight(overrides: Partial<Flight> = {}): Flight {
  return {
    id: 'F-T01',
    flightNumber: 'AU101',
    airlineCode: 'AU',
    type: 'DEPARTURE',
    origin: 'AUR Aurora',
    destination: 'WAW Warsaw',
    scheduledTime: t('12:30'),
    estimatedTime: t('12:30'),
    actualTime: null,
    status: 'SCHEDULED',
    gateId: 'A3',
    aircraftTypeCode: 'A320',
    delayReason: null,
    cancelReason: null,
    ...overrides,
  }
}

function expectOk<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(`Expected ok, got: ${result.reason}`)
  return result.value
}

function expectFail<T>(result: Result<T>, message: RegExp): void {
  expect(result.ok).toBe(false)
  if (!result.ok) expect(result.reason).toMatch(message)
}

const GATE_OK = { hasGate: true, hasConflict: false }

describe('getDelayMinutes / isFinal', () => {
  it('computes max(0, estimated − scheduled)', () => {
    expect(getDelayMinutes(makeFlight())).toBe(0)
    expect(getDelayMinutes(makeFlight({ estimatedTime: t('13:15') }))).toBe(45)
  })

  it('treats DEPARTED, LANDED, CANCELLED as final', () => {
    expect(isFinal(makeFlight({ status: 'DEPARTED' }))).toBe(true)
    expect(isFinal(makeFlight({ status: 'LANDED', type: 'ARRIVAL' }))).toBe(true)
    expect(isFinal(makeFlight({ status: 'CANCELLED' }))).toBe(true)
    expect(isFinal(makeFlight({ status: 'BOARDING' }))).toBe(false)
  })
})

describe('getAllowedTransitions (BR-01, BR-02, US-004)', () => {
  it('SCHEDULED departure: Boarding, Delay, Cancel — never Landed (US-004 AC2)', () => {
    expect(getAllowedTransitions(makeFlight())).toEqual(['BOARDING', 'DELAYED', 'CANCELLED'])
    expect(canTransition(makeFlight(), 'LANDED')).toBe(false)
  })

  it('SCHEDULED arrival: Landed, Delay, Cancel — never Boarding (TC-06)', () => {
    const arrival = makeFlight({ type: 'ARRIVAL' })
    expect(getAllowedTransitions(arrival)).toEqual(['LANDED', 'DELAYED', 'CANCELLED'])
    expect(canTransition(arrival, 'BOARDING')).toBe(false)
  })

  it('DELAYED keeps the same options as SCHEDULED (more delay allowed)', () => {
    expect(getAllowedTransitions(makeFlight({ status: 'DELAYED' }))).toEqual(['BOARDING', 'DELAYED', 'CANCELLED'])
  })

  it('BOARDING: Departed, Delay, Cancel', () => {
    expect(getAllowedTransitions(makeFlight({ status: 'BOARDING' }))).toEqual(['DEPARTED', 'DELAYED', 'CANCELLED'])
  })

  it('final statuses allow nothing (US-004 AC3), incl. every final flight in the seed', () => {
    for (const f of SEED_FLIGHTS.filter(isFinal)) expect(getAllowedTransitions(f), f.flightNumber).toEqual([])
  })
})

describe('changeStatus (BR-03, BR-04, BR-20)', () => {
  it('moves SCHEDULED → BOARDING when the gate is valid', () => {
    expect(expectOk(changeStatus(makeFlight(), 'BOARDING', GATE_OK)).flight.status).toBe('BOARDING')
  })

  it('refuses BOARDING without a gate or with a gate conflict', () => {
    expectFail(changeStatus(makeFlight({ gateId: null }), 'BOARDING', { hasGate: false, hasConflict: false }), /needs a gate/)
    expectFail(changeStatus(makeFlight(), 'BOARDING', { hasGate: true, hasConflict: true }), /conflict/)
  })

  it('DEPARTED sets actualTime = estimatedTime (US-004 AC4)', () => {
    const boarding = makeFlight({ status: 'BOARDING', estimatedTime: t('12:40') })
    const { flight } = expectOk(changeStatus(boarding, 'DEPARTED', GATE_OK))
    expect(flight.status).toBe('DEPARTED')
    expect(flight.actualTime).toBe(t('12:40'))
  })

  it('refuses DEPARTED for a boarding flight that lost its gate (BR-20)', () => {
    const boarding = makeFlight({ status: 'BOARDING', gateId: null })
    expectFail(changeStatus(boarding, 'DEPARTED', { hasGate: false, hasConflict: false }), /needs a gate/)
  })

  it('LANDED works for arrivals even without a gate and sets actualTime', () => {
    const arrival = makeFlight({ type: 'ARRIVAL', gateId: null, estimatedTime: t('13:20') })
    const { flight } = expectOk(changeStatus(arrival, 'LANDED', { hasGate: false, hasConflict: false }))
    expect(flight.status).toBe('LANDED')
    expect(flight.actualTime).toBe(t('13:20'))
  })

  it('refuses invalid transitions and leaves the input unchanged', () => {
    const input = makeFlight()
    expectFail(changeStatus(input, 'DEPARTED', GATE_OK), /cannot change from SCHEDULED to DEPARTED/)
    expectFail(changeStatus(input, 'LANDED', GATE_OK), /cannot change/)
    expectFail(changeStatus(makeFlight({ status: 'DEPARTED' }), 'BOARDING', GATE_OK), /final status/)
    expect(input.status).toBe('SCHEDULED')
  })

  it('routes DELAYED / CANCELLED to their own actions (BR-05)', () => {
    expectFail(changeStatus(makeFlight(), 'DELAYED', GATE_OK), /delay action/)
    expectFail(changeStatus(makeFlight(), 'CANCELLED', GATE_OK), /cancel action/)
    expectFail(changeStatus(makeFlight({ status: 'DELAYED' }), 'SCHEDULED', GATE_OK), /back to Scheduled/)
  })
})

describe('applyDelay (BR-06…BR-08, US-007)', () => {
  it('AU101 +45: est 13:15, DELAYED, 45 min, keeps gate A3 (US-007 AC1)', () => {
    const { flight } = expectOk(applyDelay(makeFlight(), 45, 'Weather'))
    expect(flight.estimatedTime).toBe(t('13:15'))
    expect(flight.status).toBe('DELAYED')
    expect(getDelayMinutes(flight)).toBe(45)
    expect(flight.gateId).toBe('A3')
    expect(flight.delayReason).toBe('Weather')
  })

  it('accumulates delays: 30 + 20 = 50 (US-007 AC4)', () => {
    const delayed = makeFlight({ status: 'DELAYED', estimatedTime: t('13:00') })
    const { flight } = expectOk(applyDelay(delayed, 20, 'Crew'))
    expect(getDelayMinutes(flight)).toBe(50)
  })

  it('a boarding flight becomes DELAYED again', () => {
    expect(expectOk(applyDelay(makeFlight({ status: 'BOARDING' }), 15, 'Technical')).flight.status).toBe('DELAYED')
  })

  it('rejects amounts outside 15–360 or not in steps of 5 (US-007 AC3, TC-12)', () => {
    for (const bad of [0, 10, 14, 365, 400, -15, 12.5, Number.NaN]) {
      expectFail(applyDelay(makeFlight(), bad, 'Weather'), /Delay must be/)
    }
    expectFail(applyDelay(makeFlight(), 17, 'Weather'), /steps of 5/)
    expect(validateDelayMinutes(15)).toBeNull()
    expect(validateDelayMinutes(360)).toBeNull()
  })

  it('rejects a delay past 23:59 (TC-13: 21:50 + 180)', () => {
    const late = makeFlight({ scheduledTime: t('21:50'), estimatedTime: t('21:50') })
    expectFail(applyDelay(late, 180, 'Weather'), /Exceeds operating day/)
    expect(expectOk(applyDelay(late, 125, 'Weather')).flight.estimatedTime).toBe(t('23:55'))
  })

  it('rejects final flights and unknown reasons', () => {
    expectFail(applyDelay(makeFlight({ status: 'DEPARTED' }), 30, 'Weather'), /final status/)
    expectFail(applyDelay(makeFlight({ status: 'CANCELLED' }), 30, 'Weather'), /final status/)
    // @ts-expect-error — invalid reason on purpose
    expectFail(applyDelay(makeFlight(), 30, 'Aliens'), /delay reason/)
  })

  it('does not mutate the input flight', () => {
    const input = makeFlight()
    applyDelay(input, 45, 'Weather')
    expect(input.estimatedTime).toBe(t('12:30'))
    expect(input.status).toBe('SCHEDULED')
  })
})

describe('cancelFlight (BR-09, US-008)', () => {
  it('sets CANCELLED, releases the gate and reports the previous gate (US-008 AC1)', () => {
    const result = expectOk(cancelFlight(makeFlight({ gateId: 'A2' }), 'Technical'))
    expect(result.flight.status).toBe('CANCELLED')
    expect(result.flight.gateId).toBeNull()
    expect(result.flight.cancelReason).toBe('Technical')
    expect(result.previousGateId).toBe('A2')
  })

  it('works for delayed and boarding flights', () => {
    expect(cancelFlight(makeFlight({ status: 'DELAYED' }), 'Weather').ok).toBe(true)
    expect(cancelFlight(makeFlight({ status: 'BOARDING' }), 'Crew').ok).toBe(true)
  })

  it('rejects final flights and unknown reasons', () => {
    expectFail(cancelFlight(makeFlight({ status: 'LANDED', type: 'ARRIVAL' }), 'Weather'), /final status/)
    expectFail(cancelFlight(makeFlight({ status: 'CANCELLED' }), 'Weather'), /final status/)
    // @ts-expect-error — invalid reason on purpose
    expectFail(cancelFlight(makeFlight(), ''), /cancellation reason/)
  })
})
