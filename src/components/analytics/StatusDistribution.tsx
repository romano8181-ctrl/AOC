import { STATUS_STYLES } from '@/components/statusStyles'
import type { Analytics } from '@/domain/kpi'
import type { FlightStatus } from '@/domain/types'
import { cn } from '@/lib/utils'

// Bar fills per status (status palette; identity also given by icon + label + value).
const BAR: Record<FlightStatus, string> = {
  SCHEDULED: 'bg-status-info',
  BOARDING: 'bg-status-boarding',
  DELAYED: 'bg-status-warn',
  DEPARTED: 'bg-status-ok',
  LANDED: 'bg-status-ok',
  CANCELLED: 'bg-status-critical',
}

// FR-039: horizontal bars, one per status in a fixed order; each bar labelled with its count.
export function StatusDistribution({ data }: { data: Analytics['statusDistribution'] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  const max = Math.max(1, ...data.map((d) => d.count))

  return (
    <section className="rounded-xl border bg-card/80 p-5" aria-labelledby="status-dist-title">
      <h2 id="status-dist-title" className="font-semibold">
        Flight status distribution
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">{total} flights · count per status</p>
      {total === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No flights to show.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {data.map(({ status, count }) => {
            const { label, icon: Icon } = STATUS_STYLES[status]
            const share = Math.round((count / total) * 100)
            return (
              <li
                key={status}
                className="group grid grid-cols-[7.5rem_1fr_4.5rem] items-center gap-3 text-sm"
                title={`${label}: ${count} flights (${share}%)`}
              >
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Icon className="size-4" aria-hidden />
                  {label}
                </span>
                <span className="h-5 rounded-r bg-muted/40" aria-hidden>
                  {count > 0 && (
                    <span
                      className={cn('block h-full rounded-r-[4px] transition-[width,opacity] group-hover:opacity-90', BAR[status])}
                      style={{ width: `${(count / max) * 100}%`, minWidth: 4 }}
                    />
                  )}
                </span>
                <span className="text-right font-mono tabular-nums">
                  {count}
                  <span className="ml-1.5 text-xs text-muted-foreground">{share}%</span>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
