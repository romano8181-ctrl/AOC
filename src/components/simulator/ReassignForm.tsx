import { DoorOpen } from 'lucide-react'
import { useState } from 'react'
import { AssignGateDialog } from '@/components/gates/AssignGateDialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { FlightSelect } from './FlightSelect'

// FR-033: the same assignment logic as on the Gates screen (one action, assignGate).
export function ReassignForm() {
  const [flightId, setFlightId] = useState('')
  const [dialogFlightId, setDialogFlightId] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reassign-flight">Flight</Label>
        <FlightSelect id="reassign-flight" value={flightId} onChange={setFlightId} />
        <p className="text-xs text-muted-foreground">
          Only gates without a time conflict can be chosen. Closed gates are excluded.
        </p>
      </div>
      <Button
        disabled={!flightId}
        onClick={() => setDialogFlightId(flightId)}
        className="bg-sec-gates text-[#03241f] hover:bg-sec-gates/90"
      >
        <DoorOpen aria-hidden />
        Choose gate…
      </Button>
      <AssignGateDialog
        flightId={dialogFlightId}
        onClose={() => {
          setDialogFlightId(null)
          setFlightId('')
        }}
      />
    </div>
  )
}
