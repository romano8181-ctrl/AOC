import { Ban, Hourglass, Lock, PlaneLanding, PlaneTakeoff, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { CancelForm } from '@/components/simulator/CancelForm'
import { DelayForm } from '@/components/simulator/DelayForm'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getAllowedTransitions } from '@/domain/flightRules'
import type { Flight, FlightStatus } from '@/domain/types'
import { useAocStore } from '@/store/useAocStore'

const STATUS_BUTTONS: Partial<Record<FlightStatus, { label: string; icon: typeof Users; className: string }>> = {
  BOARDING: { label: 'Boarding', icon: Users, className: 'bg-status-boarding text-[#1d1240] hover:bg-status-boarding/90' },
  DEPARTED: { label: 'Departed', icon: PlaneTakeoff, className: 'bg-status-ok text-[#05301a] hover:bg-status-ok/90' },
  LANDED: { label: 'Landed', icon: PlaneLanding, className: 'bg-status-ok text-[#05301a] hover:bg-status-ok/90' },
}

// FR-017, US-004: only the transitions the domain allows are offered.
export function FlightActions({ flight }: { flight: Flight }) {
  const changeStatus = useAocStore((s) => s.changeStatus)
  const [dialog, setDialog] = useState<'delay' | 'cancel' | null>(null)
  const allowed = getAllowedTransitions(flight)

  if (allowed.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-lg border bg-background/40 px-3 py-2 text-sm text-muted-foreground">
        <Lock className="size-4" aria-hidden />
        Final status — no further changes.
      </p>
    )
  }

  const onStatus = (to: FlightStatus) => {
    const result = changeStatus(flight.id, to)
    if (result.ok) toast.success(`${flight.flightNumber} is now ${to.toLowerCase()}`)
    else toast.error(result.reason)
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {allowed.map((to) => {
          const cfg = STATUS_BUTTONS[to]
          if (!cfg) return null
          const Icon = cfg.icon
          return (
            <Button key={to} size="sm" className={cfg.className} onClick={() => onStatus(to)}>
              <Icon aria-hidden />
              {cfg.label}
            </Button>
          )
        })}
        {allowed.includes('DELAYED') && (
          <Button size="sm" variant="outline" className="border-status-warn/50 text-status-warn hover:bg-status-warn/15 hover:text-status-warn" onClick={() => setDialog('delay')}>
            <Hourglass aria-hidden />
            Delay…
          </Button>
        )}
        {allowed.includes('CANCELLED') && (
          <Button size="sm" variant="outline" className="border-status-critical/50 text-status-critical hover:bg-status-critical/15 hover:text-status-critical" onClick={() => setDialog('cancel')}>
            <Ban aria-hidden />
            Cancel…
          </Button>
        )}
      </div>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog === 'delay' ? `Delay ${flight.flightNumber}` : `Cancel ${flight.flightNumber}`}</DialogTitle>
            <DialogDescription>Changes affect simulated data only.</DialogDescription>
          </DialogHeader>
          {dialog === 'delay' && <DelayForm flightId={flight.id} onDone={() => setDialog(null)} />}
          {dialog === 'cancel' && <CancelForm flightId={flight.id} onDone={() => setDialog(null)} />}
        </DialogContent>
      </Dialog>
    </>
  )
}
