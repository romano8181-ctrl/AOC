import { Ban, DoorOpen } from 'lucide-react'
import { FlightStatusPill } from '@/components/flights/FlightStatusPill'
import { StatusPill } from '@/components/StatusPill'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { formatWindow, getWindow, holdsGate, isInConflict } from '@/domain/gateRules'
import { useConflicts, useGateDayPlan, useGateSummaries } from '@/store/selectors'
import { cn } from '@/lib/utils'

interface GateDetailsSheetProps {
  gateId: string | null
  onClose: () => void
}

// PRD 12.3: click a gate card → all assignments of the day with their windows.
export function GateDetailsSheet({ gateId, onClose }: GateDetailsSheetProps) {
  const summary = useGateSummaries().find((s) => s.gate.id === gateId)
  const plan = useGateDayPlan(gateId)
  const conflicts = useConflicts()

  return (
    <Sheet open={summary !== undefined} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-[440px]">
        {summary && (
          <>
            <SheetHeader className="border-b">
              <div className="flex items-center gap-3 pr-8">
                <span className="flex size-10 items-center justify-center rounded-xl bg-sec-gates/15">
                  <DoorOpen className="size-5 text-sec-gates" aria-hidden />
                </span>
                <div className="flex-1">
                  <SheetTitle className="font-mono text-xl">Gate {summary.gate.id}</SheetTitle>
                  <SheetDescription>
                    Terminal {summary.gate.terminal} · {summary.gate.sizeCategory === 'WIDE' ? 'Wide-body' : 'Narrow-body'}
                  </SheetDescription>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusPill status={summary.state} />
                  {summary.hasConflict && <StatusPill status="CONFLICT" />}
                </div>
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-4 p-4">
              {summary.gate.isClosed && (
                <p className="flex items-center gap-2 rounded-lg border bg-status-neutral/10 px-3 py-2 text-sm">
                  <Ban className="size-4 text-status-neutral" aria-hidden />
                  Closed: {summary.gate.closedReason}
                </p>
              )}
              <h3 className="text-sm font-semibold">Assignments today ({plan.length})</h3>
              {plan.length === 0 ? (
                <p className="text-sm text-muted-foreground">No assignments today.</p>
              ) : (
                <ol className="flex flex-col gap-2">
                  {plan.map((f) => {
                    const conflict = isInConflict(f.id, conflicts)
                    return (
                      <li
                        key={f.id}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm',
                          conflict && 'border-status-critical/40 bg-status-critical/10',
                          !holdsGate(f) && 'opacity-60',
                        )}
                      >
                        <span className="w-24 font-mono text-xs text-muted-foreground tabular-nums">
                          {formatWindow(getWindow(f))}
                        </span>
                        <span className="w-16 font-mono font-medium">{f.flightNumber}</span>
                        <span className="w-8 text-xs text-muted-foreground">{f.type === 'ARRIVAL' ? 'ARR' : 'DEP'}</span>
                        <span className="ml-auto">
                          <FlightStatusPill flight={f} />
                        </span>
                      </li>
                    )
                  })}
                </ol>
              )}
              <p className="text-xs text-muted-foreground">
                Departed flights are shown faded: they no longer hold the gate.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
