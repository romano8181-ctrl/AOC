import type { KpiSummary } from '@/domain/kpi'

export type Metric = {
  label: string
  value: (k: KpiSummary) => number | null
  format?: (v: number | null) => string
  /** Which direction is good for the operation. */
  better: 'up' | 'down'
}

export const DELAY_METRICS: Metric[] = [
  { label: 'On time', value: (k) => k.onTime, better: 'up' },
  { label: 'Delayed', value: (k) => k.delayed, better: 'down' },
  { label: 'Avg delay', value: (k) => k.avgDelayMinutes, format: (v) => `${v} min`, better: 'down' },
  { label: 'OTP', value: (k) => k.otpPercent, format: (v) => (v === null ? '—' : `${v}%`), better: 'up' },
]

export const CLOSURE_METRICS: Metric[] = [
  { label: 'Active gates', value: (k) => k.activeGates, better: 'up' },
]
