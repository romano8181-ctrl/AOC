import { PageHeader } from '@/components/layout/PageHeader'
import { PlaceholderPanel } from '@/components/layout/PlaceholderPanel'

export function GatesPage() {
  return (
    <>
      <PageHeader section="gates" title="Gates" description="Gate states, assignments and conflicts." />
      <PlaceholderPanel
        section="gates"
        upcoming="Gate grid by terminal, gate assignment and the 'Gate required' list."
        task="T-13 · T-14"
      />
    </>
  )
}
