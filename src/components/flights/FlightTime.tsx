import { toHHMM } from '@/domain/time'
import type { Flight } from '@/domain/types'
import { cn } from '@/lib/utils'

/** Estimated time, with the scheduled time struck through when they differ. */
export function FlightTime({ flight, className }: { flight: Flight; className?: string }) {
  const changed = flight.estimatedTime !== flight.scheduledTime
  return (
    <span className={cn('inline-flex items-baseline gap-1.5 font-mono tabular-nums', className)}>
      <span className={cn('font-medium', changed && 'text-status-warn')}>{toHHMM(flight.estimatedTime)}</span>
      {changed && (
        <span className="text-xs text-muted-foreground line-through" aria-label={`scheduled ${toHHMM(flight.scheduledTime)}`}>
          {toHHMM(flight.scheduledTime)}
        </span>
      )}
    </span>
  )
}
