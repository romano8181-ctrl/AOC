import { SearchX } from 'lucide-react'
import type { GateSummary } from '@/domain/gateRules'
import type { Terminal } from '@/domain/types'
import { GateCard } from './GateCard'

interface GateGridProps {
  summaries: GateSummary[]
  onOpen: (gateId: string) => void
}

const TERMINALS: Terminal[] = ['A', 'B']

// FR-020: gates grouped by terminal.
export function GateGrid({ summaries, onOpen }: GateGridProps) {
  if (summaries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border bg-card/80 px-6 py-12 text-center text-sm text-muted-foreground">
        <SearchX className="size-6 text-sec-gates" aria-hidden />
        No gates are available right now.
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-6">
      {TERMINALS.map((terminal) => {
        const gates = summaries.filter((s) => s.gate.terminal === terminal)
        if (gates.length === 0) return null
        return (
          <section key={terminal} aria-labelledby={`terminal-${terminal}`}>
            <h2 id={`terminal-${terminal}`} className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <span className="flex size-6 items-center justify-center rounded-md bg-sec-gates/15 font-mono text-sec-gates">
                {terminal}
              </span>
              Terminal {terminal}
              <span className="text-xs font-normal text-muted-foreground">{gates.length} gates</span>
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              {gates.map((s) => (
                <GateCard key={s.gate.id} summary={s} onOpen={onOpen} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
