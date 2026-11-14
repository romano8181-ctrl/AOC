import { PageHeader } from '@/components/layout/PageHeader'
import { PlaceholderPanel } from '@/components/layout/PlaceholderPanel'

export function SimulatorPage() {
  return (
    <>
      <PageHeader
        section="simulator"
        title="Incident Simulator"
        description="Changes affect simulated data only."
      />
      <PlaceholderPanel
        section="simulator"
        upcoming="Delay, cancellation, gate closure and gate reassignment scenarios with an event log."
        task="T-15 · T-16"
      />
    </>
  )
}
