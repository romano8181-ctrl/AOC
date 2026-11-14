import type { Result } from './types'

/** Successful result carrying a value. */
export function ok<T>(value: T): Result<T> {
  return { ok: true, value }
}

/** Failed result with a human-readable reason shown to the operator. */
export function fail<T = never>(reason: string): Result<T> {
  return { ok: false, reason }
}
