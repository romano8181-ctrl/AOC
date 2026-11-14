import { KpiGrid } from '@/components/kpi/KpiGrid'
import { PageHeader } from '@/components/layout/PageHeader'
import { AlertsCard } from '@/components/overview/AlertsCard'
import { RecentEvents } from '@/components/overview/RecentEvents'
import { UpcomingFlights } from '@/components/overview/UpcomingFlights'
import { toHHMM } from '@/domain/time'
import { useSimNow } from '@/store/selectors'

// PRD 12.3 Overview: KPI cards, next 2 hours, alerts, recent events.
export function OverviewPage() {
  const simNow = useSimNow()
  return (
    <>
      <PageHeader
        section="overview"
        title="Operations Overview"
        description="Key operational KPIs for the simulated day."
        actions={
          <span className="font-mono text-xs text-muted-foreground tabular-nums">Updated {toHHMM(simNow)} SIM</span>
        }
      />
      <div className="flex flex-col gap-6">
        <KpiGrid />
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <UpcomingFlights />
          </div>
          <div className="flex flex-col gap-6">
            <AlertsCard />
            <RecentEvents />
          </div>
        </div>
      </div>
    </>
  )
}
