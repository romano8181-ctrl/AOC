import {
  Ban,
  CheckCircle2,
  CircleDot,
  Clock,
  DoorOpen,
  PlaneLanding,
  PlaneTakeoff,
  TriangleAlert,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { FlightStatus, GateState } from '@/domain/types'

/** Flight statuses (PRD 9.1) + gate states (PRD 9.3) + a gate conflict marker. */
export type PillStatus = FlightStatus | GateState | 'CONFLICT'

export interface PillStyle {
  label: string
  icon: LucideIcon
  className: string
}

// Status is always color + text + icon, never color alone (PRD 12.1, 12.5).
export const STATUS_STYLES: Record<PillStatus, PillStyle> = {
  SCHEDULED: { label: 'Scheduled', icon: Clock, className: 'bg-status-info/15 text-status-info ring-status-info/30' },
  DELAYED: { label: 'Delayed', icon: TriangleAlert, className: 'bg-status-warn/15 text-status-warn ring-status-warn/35' },
  BOARDING: { label: 'Boarding', icon: Users, className: 'bg-status-boarding/15 text-status-boarding ring-status-boarding/35' },
  DEPARTED: { label: 'Departed', icon: PlaneTakeoff, className: 'bg-status-ok/15 text-status-ok ring-status-ok/30' },
  LANDED: { label: 'Landed', icon: PlaneLanding, className: 'bg-status-ok/15 text-status-ok ring-status-ok/30' },
  CANCELLED: { label: 'Cancelled', icon: Ban, className: 'bg-status-critical/15 text-status-critical ring-status-critical/35' },
  AVAILABLE: { label: 'Available', icon: CheckCircle2, className: 'bg-status-ok/15 text-status-ok ring-status-ok/30' },
  RESERVED: { label: 'Reserved', icon: Clock, className: 'bg-status-warn/15 text-status-warn ring-status-warn/35' },
  OCCUPIED: { label: 'Occupied', icon: DoorOpen, className: 'bg-status-info/15 text-status-info ring-status-info/30' },
  UNAVAILABLE: { label: 'Unavailable', icon: Ban, className: 'bg-status-neutral/15 text-status-neutral ring-status-neutral/30' },
  CONFLICT: { label: 'Conflict', icon: CircleDot, className: 'bg-status-critical/20 text-status-critical ring-status-critical/50' },
}

/** Human-readable label, e.g. 'Delayed' (for aria-labels and filters). */
export function getStatusLabel(status: PillStatus): string {
  return STATUS_STYLES[status].label
}
