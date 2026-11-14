import { PageHeader } from '@/components/layout/PageHeader'
import { PlaceholderPanel } from '@/components/layout/PlaceholderPanel'
import { StatusPill, type PillStatus } from '@/components/StatusPill'

const FLIGHT_STATUSES: PillStatus[] = ['SCHEDULED', 'BOARDING', 'DELAYED', 'DEPARTED', 'LANDED', 'CANCELLED']
const GATE_STATES: PillStatus[] = ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'UNAVAILABLE', 'CONFLICT']

export function OverviewPage() {
  return (
    <>
      <PageHeader
        section="overview"
        title="Operations Overview"
        description="Key operational KPIs for the simulated day."
      />
      <div className="flex flex-col gap-6">
        <PlaceholderPanel
          section="overview"
          upcoming="KPI cards, flights in the next 2 hours, alerts and recent events."
          task="T-10"
        />
        {/* Status legend: shows the color language used across all screens. */}
        <section aria-labelledby="legend-title" className="rounded-xl border bg-card/60 p-5">
          <h2 id="legend-title" className="mb-4 text-sm font-semibold text-muted-foreground">
            Status legend
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs tracking-wide text-muted-foreground uppercase">Flights</p>
              <div className="flex flex-wrap gap-2">
                {FLIGHT_STATUSES.map((s) => (
                  <StatusPill key={s} status={s} />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs tracking-wide text-muted-foreground uppercase">Gates</p>
              <div className="flex flex-wrap gap-2">
                {GATE_STATES.map((s) => (
                  <StatusPill key={s} status={s} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
