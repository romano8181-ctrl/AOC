import { AnalyticsTiles } from '@/components/analytics/AnalyticsTiles'
import { FormulasPanel } from '@/components/analytics/FormulasPanel'
import { GateUtilizationChart } from '@/components/analytics/GateUtilizationChart'
import { StatusDistribution } from '@/components/analytics/StatusDistribution'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAnalytics, useGates, useKpis } from '@/store/selectors'

// PRD 12.3 Analytics. Every number comes from computeAnalytics / computeKpis — the same
// functions the Overview uses, so both screens always agree (US-011 AC2).
export function AnalyticsPage() {
  const analytics = useAnalytics()
  const kpis = useKpis()
  const gates = useGates()

  return (
    <>
      <PageHeader
        section="analytics"
        title="Analytics"
        description="Operational performance of the simulated day."
        actions={
          <span className="rounded-full bg-sec-analytics/15 px-3 py-1 text-xs font-medium text-sec-analytics">
            Based on simulated data
          </span>
        }
      />
      <div className="flex flex-col gap-6">
        <AnalyticsTiles analytics={analytics} kpis={kpis} />
        <div className="grid gap-6 xl:grid-cols-2">
          <StatusDistribution data={analytics.statusDistribution} />
          <GateUtilizationChart data={analytics.gateUtilization} gates={gates} />
        </div>
        <FormulasPanel />
      </div>
    </>
  )
}
