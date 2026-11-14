import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { FlightStatusPill } from '@/components/flights/FlightStatusPill'
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
import { formatWindow, getWindow } from '@/domain/gateRules'
import { previewGateClosure } from '@/domain/impact'
import { GATE_CLOSURE_REASONS } from '@/domain/types'
import { useFlights, useGates, useSimNow } from '@/store/selectors'
import { useAocStore } from '@/store/useAocStore'
import { KpiDeltaList } from './KpiDeltaList'
import { CLOSURE_METRICS } from './kpiMetrics'

// FR-032, BR-19…BR-21, US-009: gate + reason, preview of affected flights, confirmation.

const schema = z.object({
  gateId: z.string().min(1, 'Choose a gate.'),
  reason: z.enum(GATE_CLOSURE_REASONS, { errorMap: () => ({ message: 'Choose a closure reason.' }) }),
})
type CloseValues = z.infer<typeof schema>

export function CloseGateForm() {
  const gates = useGates()
  const flights = useFlights()
  const simNow = useSimNow()
  const closeGate = useAocStore((s) => s.closeGate)
  const navigate = useNavigate()
  const [pending, setPending] = useState<CloseValues | null>(null)
  const form = useForm<CloseValues>({ resolver: zodResolver(schema), mode: 'onChange', defaultValues: { gateId: '', reason: undefined } })
  const { errors, isValid } = form.formState
  const gateId = form.watch('gateId')

  const openGates = gates.filter((g) => !g.isClosed)
  // Dry run of the real closeGate rule (BR-19), so the preview can never disagree with the action.
  const preview = useMemo(
    () => (gateId ? previewGateClosure(flights, gates, simNow, gateId) : null),
    [flights, gates, simNow, gateId],
  )
  const affected = preview?.ok ? preview.value.affected : []

  const confirm = () => {
    if (!pending) return
    const result = closeGate(pending.gateId, pending.reason)
    setPending(null)
    if (!result.ok) {
      toast.error(result.reason)
      return
    }
    const n = result.value.affectedFlightIds.length
    if (n > 0) {
      toast.warning(`Gate ${pending.gateId} closed — ${n} flight${n === 1 ? ' needs' : 's need'} a new gate`, {
        description: pending.reason,
        action: { label: 'Assign gates', onClick: () => navigate('/gates') },
        duration: 8000,
      })
    } else {
      toast.success(`Gate ${pending.gateId} closed`, { description: `${pending.reason} · no flights affected` })
    }
    form.reset({ gateId: '', reason: undefined })
  }

  return (
    <>
      <form onSubmit={form.handleSubmit(setPending)} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="close-gate">Gate</Label>
          <Controller
            control={form.control}
            name="gateId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="close-gate" className="w-full" aria-invalid={!!errors.gateId}>
                  <SelectValue placeholder="Choose an open gate" />
                </SelectTrigger>
                <SelectContent>
                  {openGates.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      <span className="font-mono font-medium">{g.id}</span>
                      <span className="text-muted-foreground">Terminal {g.terminal}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.gateId && <p className="text-xs text-destructive">{errors.gateId.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="close-reason">Reason</Label>
          <Controller
            control={form.control}
            name="reason"
            render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger id="close-reason" className="w-full" aria-invalid={!!errors.reason}>
                  <SelectValue placeholder="Choose a reason" />
                </SelectTrigger>
                <SelectContent>
                  {GATE_CLOSURE_REASONS.map((r) => (
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

        {gateId && (
          <div className="rounded-lg border bg-background/40 p-3" aria-live="polite">
            <p className="mb-2 text-sm font-medium">
              {affected.length === 0
                ? 'No flights affected'
                : `${affected.length} flight${affected.length === 1 ? '' : 's'} will lose their gate`}
            </p>
            {affected.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {affected.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 text-sm">
                    <span className="w-16 font-mono font-medium">{f.flightNumber}</span>
                    <span className="w-28 font-mono text-xs text-muted-foreground tabular-nums">{formatWindow(getWindow(f))}</span>
                    <span className="ml-auto">
                      <FlightStatusPill flight={f} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {preview?.ok && (
              <div className="mt-3">
                <KpiDeltaList before={preview.value.kpiBefore} after={preview.value.kpiAfter} metrics={CLOSURE_METRICS} />
              </div>
            )}
          </div>
        )}

        <Button type="submit" variant="destructive" disabled={!isValid}>
          Close gate…
        </Button>
      </form>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close gate {pending?.gateId}?</AlertDialogTitle>
            <AlertDialogDescription>
              Reason: {pending?.reason}.{' '}
              {affected.length === 0
                ? 'No flights are affected.'
                : `${affected.length} flight${affected.length === 1 ? '' : 's'} (${affected.map((f) => f.flightNumber).join(', ')}) will need a new gate.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep open</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={confirm}>
              Close gate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
