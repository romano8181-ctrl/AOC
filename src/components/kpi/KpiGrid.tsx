import {
  Ban,
  CheckCircle2,
  DoorOpen,
  Hourglass,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  TriangleAlert,
} from 'lucide-react'
import { useKpis } from '@/store/selectors'
import { KpiCard } from './KpiCard'

// FR-001…FR-007: the 8 KPI cards on Overview. Numbers come only from useKpis().
export function KpiGrid() {
  const k = useKpis()
  const otp = k.otpPercent === null ? '—' : `${k.otpPercent}%`

  return (
    <section aria-label="Key performance indicators" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard label="Total flights" value={k.total} hint="Scheduled for the simulated day" icon={Plane} tone="sky" />
      <KpiCard label="Arrivals" value={k.arrivals} hint="Incl. cancelled" icon={PlaneLanding} tone="sky" />
      <KpiCard label="Departures" value={k.departures} hint="Incl. cancelled" icon={PlaneTakeoff} tone="violet" />
      <KpiCard label="On time" value={k.onTime} hint={`${otp} on-time performance`} icon={CheckCircle2} tone="green" />
      <KpiCard label="Delayed" value={k.delayed} hint="15 min or more" icon={TriangleAlert} tone="amber" />
      <KpiCard label="Cancelled" value={k.cancelled} hint="Not counted in OTP" icon={Ban} tone="rose" />
      <KpiCard
        label="Active gates"
        value={`${k.activeGates} / ${k.totalGates}`}
        hint={`${k.totalGates - k.activeGates} unavailable`}
        icon={DoorOpen}
        tone="teal"
      />
      <KpiCard
        label="Avg delay"
        value={k.avgDelayMinutes}
        unit="min"
        hint="Across delayed flights"
        icon={Hourglass}
        tone="amber"
      />
    </section>
  )
}
