import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DELAY_STEP, MAX_DELAY, MIN_DELAY, validateDelayMinutes } from '@/domain/flightRules'
import { detectConflicts, isInConflict } from '@/domain/gateRules'
import { DELAY_REASONS } from '@/domain/types'
import { useAocStore } from '@/store/useAocStore'
import { DelayImpactPreview } from './DelayImpactPreview'
import { FlightSelect } from './FlightSelect'

// FR-030, BR-06/07, US-007. Amount rules come from the domain (validateDelayMinutes);
// the end-of-day rule is checked by the store action and shown under the minutes field.

const schema = z.object({
  flightId: z.string().min(1, 'Choose a flight.'),
  minutes: z.number({ invalid_type_error: 'Enter the delay in minutes.' }).superRefine((value, ctx) => {
    const error = validateDelayMinutes(value)
    if (error) ctx.addIssue({ code: z.ZodIssueCode.custom, message: error })
  }),
  reason: z.enum(DELAY_REASONS, { errorMap: () => ({ message: 'Choose a delay reason.' }) }),
})
type DelayValues = z.infer<typeof schema>

interface DelayFormProps {
  /** Fixed flight (from the details sheet); omit to show a flight picker. */
  flightId?: string
  onDone?: () => void
  /** Show the impact preview next to the form (Simulator). */
  showPreview?: boolean
}

export function DelayForm({ flightId, onDone, showPreview = false }: DelayFormProps) {
  const applyDelay = useAocStore((s) => s.applyDelay)
  const navigate = useNavigate()
  const form = useForm<DelayValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { flightId: flightId ?? '', minutes: 45, reason: undefined },
  })
  const { errors, isValid } = form.formState
  const watchedFlightId = form.watch('flightId')
  const watchedMinutes = form.watch('minutes')

  const onSubmit = (values: DelayValues) => {
    const result = applyDelay(values.flightId, values.minutes, values.reason)
    if (!result.ok) {
      form.setError('minutes', { message: result.reason })
      return
    }
    const flight = result.value.flight
    const flights = useAocStore.getState().flights
    if (isInConflict(flight.id, detectConflicts(flights))) {
      toast.warning(`Gate conflict at ${flight.gateId} — reassign required`, {
        description: `${flight.flightNumber} delayed +${values.minutes} min (${values.reason})`,
        action: { label: 'Reassign', onClick: () => navigate('/gates') },
        duration: 8000,
      })
    } else {
      toast.success(`${flight.flightNumber} delayed +${values.minutes} min`, { description: values.reason })
    }
    form.reset({ flightId: flightId ?? '', minutes: 45, reason: undefined })
    onDone?.()
  }

  return (
    <div className={showPreview ? 'grid items-start gap-5 lg:grid-cols-2' : undefined}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {!flightId && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="delay-flight">Flight</Label>
            <Controller
              control={form.control}
              name="flightId"
              render={({ field }) => (
                <FlightSelect id="delay-flight" value={field.value} onChange={field.onChange} invalid={!!errors.flightId} />
              )}
            />
            {errors.flightId && <p className="text-xs text-destructive">{errors.flightId.message}</p>}
          </div>
        )}
  
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="delay-minutes">Delay (minutes)</Label>
          <Input
            id="delay-minutes"
            type="number"
            inputMode="numeric"
            min={MIN_DELAY}
            max={MAX_DELAY}
            step={DELAY_STEP}
            aria-invalid={!!errors.minutes}
            aria-describedby="delay-minutes-hint"
            {...form.register('minutes', { valueAsNumber: true })}
          />
          {errors.minutes ? (
            <p id="delay-minutes-hint" className="text-xs text-destructive">{errors.minutes.message}</p>
          ) : (
            <p id="delay-minutes-hint" className="text-xs text-muted-foreground">
              {MIN_DELAY}–{MAX_DELAY} min, in steps of {DELAY_STEP}. Delays add up.
            </p>
          )}
        </div>
  
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="delay-reason">Reason</Label>
          <Controller
            control={form.control}
            name="reason"
            render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger id="delay-reason" className="w-full" aria-invalid={!!errors.reason}>
                  <SelectValue placeholder="Choose a reason" />
                </SelectTrigger>
                <SelectContent>
                  {DELAY_REASONS.map((r) => (
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
  
        <Button type="submit" disabled={!isValid} className="bg-status-warn text-[#3a2600] hover:bg-status-warn/90">
          Apply delay
        </Button>
      </form>
      {showPreview && <DelayImpactPreview flightId={watchedFlightId} minutes={watchedMinutes} />}
    </div>
  )
}
