import { PageHeader } from '@/components/layout/PageHeader'
import { PlaceholderPanel } from '@/components/layout/PlaceholderPanel'

export function FlightsPage() {
  return (
    <>
      <PageHeader section="flights" title="Flights" description="Arrivals and departures for the simulated day." />
      <PlaceholderPanel
        section="flights"
        upcoming="Flight table with search, filters, sorting and flight details."
        task="T-11 · T-12"
      />
    </>
  )
}
