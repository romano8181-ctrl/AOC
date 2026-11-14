import { ArrowRight } from 'lucide-react'
import type { KpiSummary } from '@/domain/kpi'
import type { Metric } from './kpiMetrics'
import { cn } from '@/lib/utils'

interface KpiDeltaListProps {
  before: KpiSummary
  after: KpiSummary
  metrics: Metric[]
}

/** "Before → after" rows; worse values are red, better green, unchanged muted. */
export function KpiDeltaList({ before, after, metrics }: KpiDeltaListProps) {
  return (
    <dl className="grid grid-cols-2 gap-2">
      {metrics.map((m) => {
        const a = m.value(before)
        const b = m.value(after)
        const fmt = m.format ?? ((v: number | null) => String(v ?? '—'))
        const changed = a !== b
        const worse = changed && a !== null && b !== null && (m.better === 'up' ? b < a : b > a)
        return (
          <div key={m.label} className="rounded-lg border bg-background/40 px-3 py-2">
            <dt className="text-xs text-muted-foreground">{m.label}</dt>
            <dd className="flex items-center gap-1.5 font-mono text-sm tabular-nums">
              <span className={cn(changed && 'text-muted-foreground')}>{fmt(a)}</span>
              {changed && (
                <>
                  <ArrowRight className="size-3 text-muted-foreground" aria-label="becomes" />
                  <span className={cn('font-semibold', worse ? 'text-status-critical' : 'text-status-ok')}>{fmt(b)}</span>
                </>
              )}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
