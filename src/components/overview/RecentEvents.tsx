import { ArrowRight, History } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EventList } from '@/components/events/EventList'
import { useRecentEvents } from '@/store/selectors'

export function RecentEvents() {
  const events = useRecentEvents(5)

  return (
    <section className="rounded-xl border bg-card/80" aria-labelledby="recent-events-title">
      <div className="flex items-center justify-between gap-3 border-b px-5 py-3">
        <h2 id="recent-events-title" className="flex items-center gap-2 font-semibold">
          <History className="size-4 text-sec-simulator" aria-hidden />
          Recent events
        </h2>
        <Link to="/simulator" className="flex items-center gap-1 text-sm text-primary hover:underline">
          Simulator <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
      <EventList events={events} />
    </section>
  )
}
