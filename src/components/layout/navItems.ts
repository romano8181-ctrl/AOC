import {
  BarChart3,
  DoorOpen,
  LayoutDashboard,
  PlaneTakeoff,
  Siren,
  type LucideIcon,
} from 'lucide-react'

export type SectionKey = 'overview' | 'flights' | 'gates' | 'analytics' | 'simulator'

/** Literal Tailwind classes per section color (literal so Tailwind generates them). */
export interface SectionTone {
  /** Icon / text color */
  text: string
  /** Soft tinted background, e.g. icon tiles */
  tint: string
  /** Stronger tint for the active nav item */
  activeBg: string
  /** Solid color bar / dot */
  solid: string
}

export interface NavItem {
  key: SectionKey
  to: string
  label: string
  icon: LucideIcon
  tone: SectionTone
}

// Routes from PRD section 11 (navigation). Each section has its own friendly color.
export const NAV_ITEMS: NavItem[] = [
  {
    key: 'overview',
    to: '/',
    label: 'Overview',
    icon: LayoutDashboard,
    tone: { text: 'text-sec-overview', tint: 'bg-sec-overview/15', activeBg: 'bg-sec-overview/20', solid: 'bg-sec-overview' },
  },
  {
    key: 'flights',
    to: '/flights',
    label: 'Flights',
    icon: PlaneTakeoff,
    tone: { text: 'text-sec-flights', tint: 'bg-sec-flights/15', activeBg: 'bg-sec-flights/20', solid: 'bg-sec-flights' },
  },
  {
    key: 'gates',
    to: '/gates',
    label: 'Gates',
    icon: DoorOpen,
    tone: { text: 'text-sec-gates', tint: 'bg-sec-gates/15', activeBg: 'bg-sec-gates/20', solid: 'bg-sec-gates' },
  },
  {
    key: 'analytics',
    to: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
    tone: { text: 'text-sec-analytics', tint: 'bg-sec-analytics/15', activeBg: 'bg-sec-analytics/20', solid: 'bg-sec-analytics' },
  },
  {
    key: 'simulator',
    to: '/simulator',
    label: 'Simulator',
    icon: Siren,
    tone: { text: 'text-sec-simulator', tint: 'bg-sec-simulator/15', activeBg: 'bg-sec-simulator/20', solid: 'bg-sec-simulator' },
  },
]

export function getSection(key: SectionKey): NavItem {
  return NAV_ITEMS.find((item) => item.key === key) ?? NAV_ITEMS[0]
}
