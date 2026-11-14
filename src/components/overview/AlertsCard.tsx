import { ArrowRight, BellRing, CheckCircle2, OctagonAlert, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAlerts } from '@/store/selectors'

// FR-008, US-002: gate conflicts (critical) and flights without a gate (warning).
export function AlertsCard() {
  const alerts = useAlerts()

  return (
    <section className="rounded-xl border bg-card/80" aria-labelledby="alerts-title">
      <div className="flex items-center justify-between gap-3 border-b px-5 py-3">
        <h2 id="alerts-title" className="flex items-center gap-2 font-semibold">
          <BellRing className="size-4 text-status-critical" aria-hidden />
          Alerts
          <span
            className={cn(
              'rounded-full px-2 text-xs font-medium',
              alerts.length > 0 ? 'bg-status-critical/15 text-status-critical' : 'bg-status-ok/15 text-status-ok',
            )}
          >
            {alerts.length}
          </span>
        </h2>
        {alerts.length > 0 && (
          <Link to="/gates" className="flex items-center gap-1 text-sm text-primary hover:underline">
            Resolve <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="flex items-center gap-3 px-5 py-6 text-sm">
          <CheckCircle2 className="size-5 text-status-ok" aria-hidden />
          <span>No active alerts</span>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 p-3" aria-live="polite">
          {alerts.map((a) => {
            const critical = a.severity === 'critical'
            const Icon = critical ? OctagonAlert : TriangleAlert
            return (
              <li
                key={a.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm',
                  critical
                    ? 'border-status-critical/30 bg-status-critical/10'
                    : 'border-status-warn/30 bg-status-warn/10',
                )}
              >
                <Icon className={cn('size-4 shrink-0', critical ? 'text-status-critical' : 'text-status-warn')} aria-hidden />
                <span className="flex-1">{a.message}</span>
                <span
                  className={cn(
                    'rounded px-1.5 text-[10px] font-semibold tracking-wide uppercase',
                    critical ? 'bg-status-critical/20 text-status-critical' : 'bg-status-warn/20 text-status-warn',
                  )}
                >
                  {critical ? 'Critical' : 'Action'}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
