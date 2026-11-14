import { PageHeader } from '@/components/layout/PageHeader'
import { PlaceholderPanel } from '@/components/layout/PlaceholderPanel'

export function AnalyticsPage() {
  return (
    <>
      <PageHeader section="analytics" title="Analytics" description="Based on simulated data." />
      <PlaceholderPanel
        section="analytics"
        upcoming="On-time performance, status distribution, average delay and gate utilization."
        task="T-17"
      />
    </>
  )
}
