import { Ban, CheckCircle2, Hourglass } from 'lucide-react'
import type { Analytics, KpiSummary } from '@/domain/kpi'
import { cn } from '@/lib/utils'

interface AnalyticsTilesProps {
  analytics: Analytics
  kpis: KpiSummary
}

// FR-038, FR-041: headline numbers. A single number is a tile, not a chart (dataviz: hero number).
export function AnalyticsTiles({ analytics, kpis }: AnalyticsTilesProps) {
  const otp = analytics.otpPercent
  const measured = kpis.total - kpis.cancelled

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-xl border bg-card/80 p-5 md:row-span-1">
        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CheckCircle2 className="size-4 text-status-ok" aria-hidden />
          On-time performance
        </p>
        <p className="mt-2 font-mono text-5xl font-semibold tabular-nums">{otp === null ? '—' : `${otp}%`}</p>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label={otp === null ? 'No flights to measure' : `${otp} percent on time`}
        >
          <div className="h-full rounded-full bg-status-ok transition-[width]" style={{ width: `${otp ?? 0}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {kpis.onTime} of {measured} operated flights less than 15 min late
        </p>
      </div>

      <div className="rounded-xl border bg-card/80 p-5">
        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Hourglass className="size-4 text-status-warn" aria-hidden />
          Average delay
        </p>
        <p className="mt-2 font-mono text-5xl font-semibold tabular-nums">
          {analytics.avgDelayMinutes}
          <span className="ml-1 text-xl font-medium text-muted-foreground">min</span>
        </p>
        <p className="mt-5 text-xs text-muted-foreground">
          Across {kpis.delayed} delayed flight{kpis.delayed === 1 ? '' : 's'} (15 min or more)
        </p>
      </div>

      <div className="rounded-xl border bg-card/80 p-5">
        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Ban className="size-4 text-status-critical" aria-hidden />
          Cancelled
        </p>
        <p className="mt-2 font-mono text-5xl font-semibold tabular-nums">
          {analytics.cancelled}
          <span className={cn('ml-2 text-xl font-medium text-muted-foreground')}>{analytics.cancelledPercent}%</span>
        </p>
        <p className="mt-5 text-xs text-muted-foreground">Of {kpis.total} scheduled flights · excluded from OTP</p>
      </div>
    </div>
  )
}
