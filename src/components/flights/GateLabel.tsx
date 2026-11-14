import { TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GateLabelProps {
  gateId: string | null
  inConflict?: boolean
  /** Cancelled flights have no gate on purpose: show a dash, not a warning. */
  muted?: boolean
}

/** Gate code; amber "No gate" when missing, red with an icon when in conflict. */
export function GateLabel({ gateId, inConflict = false, muted = false }: GateLabelProps) {
  if (gateId === null) {
    if (muted) return <span className="text-muted-foreground">—</span>
    return <span className="text-xs font-semibold text-status-warn">No gate</span>
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-sm font-medium',
        inConflict ? 'bg-status-critical/15 text-status-critical' : 'bg-sec-gates/10 text-sec-gates',
      )}
      title={inConflict ? 'Gate conflict' : undefined}
    >
      {gateId}
      {inConflict && <TriangleAlert className="size-3.5" aria-label="gate conflict" />}
    </span>
  )
}
