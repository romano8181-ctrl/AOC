import { StatusPill } from '@/components/StatusPill'
import { getDelayMinutes } from '@/domain/flightRules'
import { formatDelay } from '@/domain/time'
import type { Flight } from '@/domain/types'

/** Flight status with the delay in minutes when the flight is late (e.g. "Delayed +45"). */
export function FlightStatusPill({ flight }: { flight: Flight }) {
  const delay = flight.status === 'CANCELLED' ? 0 : getDelayMinutes(flight)
  return <StatusPill status={flight.status} detail={delay > 0 ? formatDelay(delay) : undefined} />
}
