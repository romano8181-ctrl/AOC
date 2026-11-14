import { cn } from '@/lib/utils'
import { STATUS_STYLES, type PillStatus } from './statusStyles'

export type { PillStatus } from './statusStyles'

interface StatusPillProps {
  status: PillStatus
  /** Extra text after the label, e.g. "+45" for a delay. */
  detail?: string
  className?: string
}

export function StatusPill({ status, detail, className }: StatusPillProps) {
  const { label, icon: Icon, className: tone } = STATUS_STYLES[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset',
        tone,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
      {detail && <span className="font-mono tabular-nums">{detail}</span>}
    </span>
  )
}
