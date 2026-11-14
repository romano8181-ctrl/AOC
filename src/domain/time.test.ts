import { describe, expect, it } from 'vitest'
import {
  DAY_END,
  DAY_START,
  LAST_MINUTE,
  OPERATING_MINUTES,
  SIM_NOW,
  formatDelay,
  formatDuration,
  formatSimDate,
  fromHHMM,
  isValidMinute,
  isWithinOperatingDay,
  toHHMM,
} from './time'

describe('time constants', () => {
  it('match the simulated day in PRD 13.1', () => {
    expect(DAY_START).toBe(360) // 06:00
    expect(DAY_END).toBe(1320) // 22:00
    expect(OPERATING_MINUTES).toBe(960)
    expect(SIM_NOW).toBe(720) // 12:00
    expect(LAST_MINUTE).toBe(1439) // 23:59
  })
})

describe('toHHMM', () => {
  it('formats minutes with leading zeros', () => {
    expect(toHHMM(0)).toBe('00:00')
    expect(toHHMM(65)).toBe('01:05')
    expect(toHHMM(750)).toBe('12:30')
    expect(toHHMM(1439)).toBe('23:59')
  })

  it('renders invalid input as --:-- instead of throwing', () => {
    expect(toHHMM(-1)).toBe('--:--')
    expect(toHHMM(1440)).toBe('--:--')
    expect(toHHMM(12.5)).toBe('--:--')
    expect(toHHMM(Number.NaN)).toBe('--:--')
  })
})

describe('fromHHMM', () => {
  it('parses valid times, with or without a leading zero and surrounding spaces', () => {
    expect(fromHHMM('12:30')).toBe(750)
    expect(fromHHMM('9:05')).toBe(545)
    expect(fromHHMM(' 00:00 ')).toBe(0)
    expect(fromHHMM('23:59')).toBe(1439)
  })

  it('returns null for invalid input', () => {
    for (const bad of ['', '24:00', '12:60', '1230', '12:3', 'ab:cd', '-1:00', '12:30:00']) {
      expect(fromHHMM(bad), bad).toBeNull()
    }
  })

  it('round-trips every minute of the day', () => {
    for (let m = 0; m <= LAST_MINUTE; m++) {
      expect(fromHHMM(toHHMM(m))).toBe(m)
    }
  })
})

describe('isValidMinute / isWithinOperatingDay', () => {
  it('accepts only integer minutes of the day', () => {
    expect(isValidMinute(0)).toBe(true)
    expect(isValidMinute(1439)).toBe(true)
    expect(isValidMinute(1440)).toBe(false)
    expect(isValidMinute(-5)).toBe(false)
    expect(isValidMinute(1.5)).toBe(false)
  })

  it('treats 06:00 and 22:00 as inside the operating day', () => {
    expect(isWithinOperatingDay(DAY_START)).toBe(true)
    expect(isWithinOperatingDay(DAY_END)).toBe(true)
    expect(isWithinOperatingDay(DAY_START - 1)).toBe(false)
    expect(isWithinOperatingDay(DAY_END + 1)).toBe(false)
  })
})

describe('formatters', () => {
  it('formatDelay shows a plus sign for positive delays', () => {
    expect(formatDelay(45)).toBe('+45')
    expect(formatDelay(0)).toBe('0')
  })

  it('formatDuration renders hours and minutes', () => {
    expect(formatDuration(45)).toBe('45m')
    expect(formatDuration(60)).toBe('1h')
    expect(formatDuration(95)).toBe('1h 35m')
    expect(formatDuration(-1)).toBe('—')
  })

  it('formatSimDate renders the simulated date without time-zone shifts', () => {
    expect(formatSimDate()).toBe('18 Nov 2026')
    expect(formatSimDate('2026-01-05')).toBe('5 Jan 2026')
    expect(formatSimDate('bad')).toBe('bad')
  })
})
