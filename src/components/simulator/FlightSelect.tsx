import { useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { isActive } from '@/domain/flightRules'
import { toHHMM } from '@/domain/time'
import { useFlights } from '@/store/selectors'

interface FlightSelectProps {
  id?: string
  value: string
  onChange: (flightId: string) => void
  invalid?: boolean
}

/** Only flights that can still change (SCHEDULED / DELAYED / BOARDING), by estimated time (US-007 edge case). */
export function FlightSelect({ id, value, onChange, invalid }: FlightSelectProps) {
  const flights = useFlights()
  const options = useMemo(
    () => flights.filter(isActive).sort((a, b) => a.estimatedTime - b.estimatedTime),
    [flights],
  )
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full" aria-invalid={invalid}>
        <SelectValue placeholder="Choose a flight" />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {options.map((f) => (
          <SelectItem key={f.id} value={f.id}>
            <span className="font-mono font-medium">{f.flightNumber}</span>
            <span className="font-mono text-muted-foreground tabular-nums">{toHHMM(f.estimatedTime)}</span>
            <span className="text-muted-foreground">· {f.gateId ?? 'no gate'}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
