import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type KpiTone = 'sky' | 'violet' | 'teal' | 'green' | 'amber' | 'rose'

// Literal classes so Tailwind generates them.
const TONES: Record<KpiTone, { icon: string; tint: string; bar: string }> = {
  sky: { icon: 'text-sec-overview', tint: 'bg-sec-overview/15', bar: 'bg-sec-overview' },
  violet: { icon: 'text-sec-flights', tint: 'bg-sec-flights/15', bar: 'bg-sec-flights' },
  teal: { icon: 'text-sec-gates', tint: 'bg-sec-gates/15', bar: 'bg-sec-gates' },
  green: { icon: 'text-status-ok', tint: 'bg-status-ok/15', bar: 'bg-status-ok' },
  amber: { icon: 'text-status-warn', tint: 'bg-status-warn/15', bar: 'bg-status-warn' },
  rose: { icon: 'text-status-critical', tint: 'bg-status-critical/15', bar: 'bg-status-critical' },
}

interface KpiCardProps {
  label: string
  value: string | number
  /** Small unit after the value, e.g. "min". */
  unit?: string
  /** One line under the value, e.g. "84.8% on-time performance". */
  hint?: string
  icon: LucideIcon
  tone: KpiTone
}

export function KpiCard({ label, value, unit, hint, icon: Icon, tone }: KpiCardProps) {
  const t = TONES[tone]
  return (
    <div className="relative overflow-hidden rounded-xl border bg-card/80 p-4">
      <div className={cn('absolute inset-y-0 left-0 w-1', t.bar)} aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', t.tint)}>
          <Icon className={cn('size-4', t.icon)} aria-hidden />
        </span>
      </div>
      <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">
        {value}
        {unit && <span className="ml-1 text-base font-medium text-muted-foreground">{unit}</span>}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
