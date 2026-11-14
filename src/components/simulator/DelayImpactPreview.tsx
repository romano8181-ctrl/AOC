import { CheckCircle2, Eye, OctagonAlert } from 'lucide-react'
import { useMemo } from 'react'
import { previewDelay } from '@/domain/impact'
import { formatWindow, getWindow } from '@/domain/gateRules'
import { toHHMM } from '@/domain/time'
import { useFlights, useGates, useSimNow } from '@/store/selectors'
import { KpiDeltaList } from './KpiDeltaList'
import { DELAY_METRICS } from './kpiMetrics'

interface DelayImpactPreviewProps {
  flightId: string
  minutes: number
}

// US-007 AC2 / PRD 12.3: what the delay will do, before the operator applies it.
export function DelayImpactPreview({ flightId, minutes }: DelayImpactPreviewProps) {
  const flights = useFlights()
  const gates = useGates()
  const simNow = useSimNow()
  const preview = useMemo(
    () => (flightId ? previewDelay(flights, gates, simNow, flightId, minutes) : null),
    [flights, gates, simNow, flightId, minutes],
  )
  const original = flights.find((f) => f.id === flightId)

  return (
    <aside className="flex flex-col gap-3 rounded-xl border border-dashed border-status-warn/40 bg-status-warn/5 p-4" aria-live="polite" aria-label="Impact preview">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Eye className="size-4 text-status-warn" aria-hidden />
        Impact preview
      </h3>

      {!preview || !original ? (
        <p className="text-sm text-muted-foreground">Choose a flight to see what the delay will change.</p>
      ) : !preview.ok ? (
        <p className="text-sm text-muted-foreground">{preview.reason}</p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">{original.type === 'DEPARTURE' ? 'New ETD' : 'New ETA'}</dt>
              <dd className="font-mono tabular-nums">
                <span className="text-muted-foreground line-through">{toHHMM(original.estimatedTime)}</span>{' '}
                <span className="font-semibold text-status-warn">{toHHMM(preview.value.flight.estimatedTime)}</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Gate window</dt>
              <dd className="font-mono tabular-nums">
                {preview.value.window ? (
                  <>
                    {original.gateId} · {formatWindow(preview.value.window)}
                  </>
                ) : (
                  <span className="text-status-warn">No gate</span>
                )}
              </dd>
            </div>
          </dl>

          {preview.value.newConflicts.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {preview.value.newConflicts.map((c) => (
                <li key={c.other.id} className="flex items-start gap-2 rounded-lg border border-status-critical/40 bg-status-critical/10 px-3 py-2 text-sm">
                  <OctagonAlert className="mt-0.5 size-4 shrink-0 text-status-critical" aria-hidden />
                  <span>
                    Will conflict with <b className="font-mono">{c.other.flightNumber}</b> on {c.gateId} (
                    {formatWindow(getWindow(c.other))}). You will need to reassign a gate.
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 rounded-lg border border-status-ok/30 bg-status-ok/10 px-3 py-2 text-sm">
              <CheckCircle2 className="size-4 text-status-ok" aria-hidden />
              No new gate conflict
            </p>
          )}

          <KpiDeltaList before={preview.value.kpiBefore} after={preview.value.kpiAfter} metrics={DELAY_METRICS} />
        </>
      )}
    </aside>
  )
}
