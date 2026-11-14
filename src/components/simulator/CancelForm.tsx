import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CANCEL_REASONS } from '@/domain/types'
import { useFlights } from '@/store/selectors'
import { useAocStore } from '@/store/useAocStore'
import { FlightSelect } from './FlightSelect'

// FR-031, BR-09, US-008: reason required, explicit confirmation, gate released.

const schema = z.object({
  flightId: z.string().min(1, 'Choose a flight.'),
  reason: z.enum(CANCEL_REASONS, { errorMap: () => ({ message: 'Choose a cancellation reason.' }) }),
})
type CancelValues = z.infer<typeof schema>

interface CancelFormProps {
  flightId?: string
  onDone?: () => void
}

export function CancelForm({ flightId, onDone }: CancelFormProps) {
  const cancelFlight = useAocStore((s) => s.cancelFlight)
  const flights = useFlights()
  const [pending, setPending] = useState<CancelValues | null>(null)
  const form = useForm<CancelValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { flightId: flightId ?? '', reason: undefined },
  })
  const { errors, isValid } = form.formState
  const target = pending ? flights.find((f) => f.id === pending.flightId) : undefined

  const confirm = () => {
    if (!pending) return
    const result = cancelFlight(pending.flightId, pending.reason)
    setPending(null)
    if (!result.ok) {
      toast.error(result.reason)
      return
    }
    const gatePart = target?.gateId ? ` — gate ${target.gateId} released` : ''
    toast.success(`${result.value.flight.flightNumber} cancelled${gatePart}`, { description: pending.reason })
    form.reset({ flightId: flightId ?? '', reason: undefined })
    onDone?.()
  }

  return (
    <>
      <form onSubmit={form.handleSubmit(setPending)} className="flex flex-col gap-4" noValidate>
        {!flightId && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cancel-flight">Flight</Label>
            <Controller
              control={form.control}
              name="flightId"
              render={({ field }) => (
                <FlightSelect id="cancel-flight" value={field.value} onChange={field.onChange} invalid={!!errors.flightId} />
              )}
            />
            {errors.flightId && <p className="text-xs text-destructive">{errors.flightId.message}</p>}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cancel-reason">Reason</Label>
          <Controller
            control={form.control}
            name="reason"
            render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger id="cancel-reason" className="w-full" aria-invalid={!!errors.reason}>
                  <SelectValue placeholder="Choose a reason" />
                </SelectTrigger>
                <SelectContent>
                  {CANCEL_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
        </div>

        <Button type="submit" variant="destructive" disabled={!isValid}>
          Cancel flight…
        </Button>
      </form>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {target?.flightNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              Reason: {pending?.reason}.{' '}
              {target?.gateId ? `Gate ${target.gateId} will be released. ` : ''}
              This cannot be undone in the simulation (only Reset restores it).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep flight</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={confirm}>
              Cancel flight
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
