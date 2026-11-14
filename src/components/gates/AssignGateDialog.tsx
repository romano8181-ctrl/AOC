import { CheckCircle2, Maximize2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatWindow, getAssignmentOptions, getWindow } from '@/domain/gateRules'
import type { Terminal } from '@/domain/types'
import { cn } from '@/lib/utils'
import { useFlight, useFlights, useGates } from '@/store/selectors'
import { useAocStore } from '@/store/useAocStore'

interface AssignGateDialogProps {
  /** Flight to (re)assign; null closes the dialog. */
  flightId: string | null
  onClose: () => void
}

const TERMINALS: Terminal[] = ['A', 'B']

// FR-024…FR-026, US-006: every gate is listed; unusable ones are disabled with the reason
// from validateAssignment. Save stays disabled until a usable gate is chosen.
export function AssignGateDialog({ flightId, onClose }: AssignGateDialogProps) {
  const flight = useFlight(flightId)
  const flights = useFlights()
  const gates = useGates()
  const assignGate = useAocStore((s) => s.assignGate)
  const [selected, setSelected] = useState<string | null>(null)

  const options = useMemo(
    () => (flight ? getAssignmentOptions(flight, gates, flights) : []),
    [flight, gates, flights],
  )
  const selectable = options.some((o) => o.gate.id === selected && o.reason === null)
  const isReassign = flight?.gateId != null

  const close = () => {
    setSelected(null)
    onClose()
  }

  const save = () => {
    if (!flight || !selected) return
    const from = flight.gateId
    const result = assignGate(flight.id, selected)
    if (!result.ok) {
      toast.error(result.reason)
      return
    }
    toast.success(
      from ? `${flight.flightNumber} moved from gate ${from} to ${selected}` : `${flight.flightNumber} assigned to gate ${selected}`,
    )
    close()
  }

  return (
    <Dialog open={flight !== undefined} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-lg">
        {flight && (
          <>
            <DialogHeader>
              <DialogTitle>
                {isReassign ? 'Reassign gate' : 'Assign gate'} · <span className="font-mono">{flight.flightNumber}</span>
              </DialogTitle>
              <DialogDescription>
                {flight.type === 'ARRIVAL' ? 'Arrival' : 'Departure'} · needs the gate{' '}
                <span className="font-mono text-foreground">{formatWindow(getWindow(flight))}</span>
                {isReassign && (
                  <>
                    {' '}· now at <span className="font-mono text-foreground">{flight.gateId}</span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div role="radiogroup" aria-label="Gates" className="flex max-h-[55vh] flex-col gap-4 overflow-y-auto pr-1">
              {TERMINALS.map((terminal) => (
                <div key={terminal} className="flex flex-col gap-1.5">
                  <p className="text-xs tracking-wide text-muted-foreground uppercase">Terminal {terminal}</p>
                  {options
                    .filter((o) => o.gate.terminal === terminal)
                    .map(({ gate, reason }) => {
                      const checked = selected === gate.id
                      const disabled = reason !== null
                      return (
                        <button
                          key={gate.id}
                          type="button"
                          role="radio"
                          aria-checked={checked}
                          aria-disabled={disabled}
                          aria-describedby={disabled ? `reason-${gate.id}` : undefined}
                          disabled={disabled}
                          onClick={() => setSelected(gate.id)}
                          className={cn(
                            'flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                            disabled
                              ? 'cursor-not-allowed opacity-55'
                              : 'hover:border-sec-gates/50 hover:bg-sec-gates/5',
                            checked && 'border-sec-gates bg-sec-gates/15',
                          )}
                        >
                          <span
                            className={cn(
                              'flex size-4 shrink-0 items-center justify-center rounded-full border',
                              checked ? 'border-sec-gates bg-sec-gates' : 'border-muted-foreground/50',
                            )}
                            aria-hidden
                          >
                            {checked && <span className="size-1.5 rounded-full bg-background" />}
                          </span>
                          <span className={cn('w-8 font-mono font-semibold', !disabled && 'text-sec-gates')}>{gate.id}</span>
                          {gate.sizeCategory === 'WIDE' && <Maximize2 className="size-3.5 text-muted-foreground" aria-label="wide-body gate" />}
                          {disabled ? (
                            <span id={`reason-${gate.id}`} className="ml-auto text-xs text-muted-foreground">
                              {reason}
                            </span>
                          ) : (
                            <span className="ml-auto flex items-center gap-1 text-xs text-status-ok">
                              <CheckCircle2 className="size-3.5" aria-hidden />
                              Free for this window
                            </span>
                          )}
                        </button>
                      )
                    })}
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button
                disabled={!selectable}
                onClick={save}
                className="bg-sec-gates text-[#03241f] hover:bg-sec-gates/90"
              >
                {selected && selectable ? `${isReassign ? 'Move' : 'Assign'} to ${selected}` : 'Choose a gate'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
