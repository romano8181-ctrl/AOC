import { ChevronDown, Sigma } from 'lucide-react'

const FORMULAS = [
  ['On time', 'not cancelled and delay < 15 min (A15 standard)'],
  ['Delayed', 'not cancelled and delay ≥ 15 min — includes completed flights that were late'],
  ['OTP', 'on time ÷ (total − cancelled) × 100'],
  ['Average delay', 'mean delay of delayed flights only, rounded to whole minutes'],
  ['Delay', 'max(0, estimated time − scheduled time)'],
  ['Gate utilization', 'Σ occupancy-window minutes inside 06:00–22:00 ÷ 960 × 100; cancelled flights excluded'],
  ['Gate window', 'departure: 45 min before → 15 min after · arrival: 15 min before → 45 min after'],
] as const

// PRD 12.3: how every number is calculated, for the operator and the audience.
export function FormulasPanel() {
  return (
    <details className="group rounded-xl border bg-card/80">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3 font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        <Sigma className="size-4 text-sec-analytics" aria-hidden />
        How these numbers are calculated
        <ChevronDown className="ml-auto size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <dl className="grid gap-x-6 gap-y-2 border-t px-5 py-4 text-sm md:grid-cols-[10rem_1fr]">
        {FORMULAS.map(([term, def]) => (
          <div key={term} className="contents">
            <dt className="font-medium">{term}</dt>
            <dd className="text-muted-foreground">{def}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
