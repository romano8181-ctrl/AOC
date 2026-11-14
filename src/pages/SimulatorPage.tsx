import { Ban, DoorClosed, DoorOpen, History, Hourglass, ShieldAlert } from 'lucide-react'
import { EventList } from '@/components/events/EventList'
import { PageHeader } from '@/components/layout/PageHeader'
import { CancelForm } from '@/components/simulator/CancelForm'
import { CloseGateForm } from '@/components/simulator/CloseGateForm'
import { DelayForm } from '@/components/simulator/DelayForm'
import { ReassignForm } from '@/components/simulator/ReassignForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRecentEvents } from '@/store/selectors'

const TABS = [
  { value: 'delay', label: 'Delay', icon: Hourglass, active: 'data-[state=active]:bg-status-warn/20 data-[state=active]:text-status-warn', hint: 'Push a flight later. Its gate window moves with it and may create a conflict.' },
  { value: 'cancel', label: 'Cancel', icon: Ban, active: 'data-[state=active]:bg-status-critical/20 data-[state=active]:text-status-critical', hint: 'Cancel a flight. Its gate is released immediately.' },
  { value: 'close', label: 'Close gate', icon: DoorClosed, active: 'data-[state=active]:bg-status-critical/20 data-[state=active]:text-status-critical', hint: 'Take a gate out of service. Its active flights need a new gate.' },
  { value: 'reassign', label: 'Reassign gate', icon: DoorOpen, active: 'data-[state=active]:bg-sec-gates/20 data-[state=active]:text-sec-gates', hint: 'Move a flight to another gate without creating a conflict.' },
] as const

// PRD 12.3 Simulator: 4 incident scenarios (FR-030…FR-033) + full event log (FR-035).
export function SimulatorPage() {
  const events = useRecentEvents()

  return (
    <>
      <PageHeader
        section="simulator"
        title="Incident Simulator"
        description="Trigger operational incidents and watch every screen react."
        actions={
          <span className="flex items-center gap-2 rounded-full border border-status-warn/40 bg-status-warn/10 px-3 py-1 text-xs font-medium text-status-warn">
            <ShieldAlert className="size-3.5" aria-hidden />
            Changes affect simulated data only
          </span>
        }
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-xl border bg-card/80 p-5 xl:col-span-2" aria-label="Scenarios">
          <Tabs defaultValue="delay" className="gap-5">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-background/60 p-1 md:grid-cols-4">
              {TABS.map(({ value, label, icon: Icon, active }) => (
                <TabsTrigger key={value} value={value} className={`gap-2 py-2 ${active}`}>
                  <Icon className="size-4" aria-hidden />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            {TABS.map(({ value, hint }) => (
              <TabsContent key={value} value={value} className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">{hint}</p>
                {value === 'delay' && <DelayForm showPreview />}
                {value === 'cancel' && <CancelForm />}
                {value === 'close' && <CloseGateForm />}
                {value === 'reassign' && <ReassignForm />}
              </TabsContent>
            ))}
          </Tabs>
        </section>

        <section className="flex flex-col rounded-xl border bg-card/80" aria-labelledby="event-log-title">
          <div className="flex items-center gap-2 border-b px-5 py-3">
            <History className="size-4 text-sec-simulator" aria-hidden />
            <h2 id="event-log-title" className="font-semibold">
              Event log
            </h2>
            <span className="rounded-full bg-sec-simulator/15 px-2 text-xs font-medium text-sec-simulator">{events.length}</span>
          </div>
          <div className="max-h-[560px] overflow-y-auto" aria-live="polite">
            <EventList events={events} emptyText="No events yet. Trigger a scenario on the left." />
          </div>
        </section>
      </div>
    </>
  )
}
