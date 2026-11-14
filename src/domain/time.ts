import type { Minutes } from './types'

// Simulated-day clock (PRD 10, 13.1). All domain times are minutes since 00:00.

export const MINUTES_PER_DAY = 1440
/** Last valid minute of the day (23:59). Estimated times may not exceed it (BR-07). */
export const LAST_MINUTE: Minutes = 1439
/** Operating period 06:00–22:00. */
export const DAY_START: Minutes = 360
export const DAY_END: Minutes = 1320
export const OPERATING_MINUTES = DAY_END - DAY_START // 960
/** Simulated "now", fixed at 12:00 for the MVP (FR-047 makes it movable in P1). */
export const SIM_NOW: Minutes = 720
/** Simulated date, ISO. */
export const SIM_DATE = '2026-11-18'
/** On-time threshold (A15): delay below this many minutes is on time. */
export const ON_TIME_THRESHOLD = 15

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** True for an integer minute within the simulated day (0..1439). */
export function isValidMinute(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= LAST_MINUTE
}

/** 750 -> '12:30'. Invalid input renders as '--:--' instead of throwing. */
export function toHHMM(minutes: Minutes): string {
  if (!isValidMinute(minutes)) return '--:--'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** '12:30' or '9:05' -> minutes. Returns null for anything that is not a valid time of day. */
export function fromHHMM(text: string): Minutes | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text.trim())
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  if (h > 23 || m > 59) return null
  return h * 60 + m
}

/** 45 -> '+45', 0 -> '0'. Used for delay badges. */
export function formatDelay(minutes: number): string {
  return minutes > 0 ? `+${minutes}` : '0'
}

/** 95 -> '1h 35m', 45 -> '45m'. */
export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

/** '2026-11-18' -> '18 Nov 2026'. Parsed by hand to avoid time-zone shifts. */
export function formatSimDate(isoDate: string = SIM_DATE): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!match) return isoDate
  const month = MONTHS.at(Number(match[2]) - 1)
  return month ? `${Number(match[3])} ${month} ${match[1]}` : isoDate
}

/** True when the minute is inside the 06:00–22:00 operating period (inclusive). */
export function isWithinOperatingDay(minutes: Minutes): boolean {
  return isValidMinute(minutes) && minutes >= DAY_START && minutes <= DAY_END
}
