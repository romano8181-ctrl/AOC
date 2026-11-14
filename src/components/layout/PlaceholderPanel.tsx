import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSection, type SectionKey } from './navItems'

interface PlaceholderPanelProps {
  section: SectionKey
  /** What this page will contain, in one line. */
  upcoming: string
  /** Backlog task that builds it, e.g. "T-10". */
  task: string
}

// Temporary empty state for pages that are not built yet.
export function PlaceholderPanel({ section, upcoming, task }: PlaceholderPanelProps) {
  const { tone } = getSection(section)
  return (
    <div className="relative flex min-h-80 flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border bg-card/60 p-8 text-center">
      <div className={cn('absolute inset-x-0 top-0 h-1', tone.solid)} aria-hidden />
      <div className={cn('flex size-14 items-center justify-center rounded-full', tone.tint)}>
        <Sparkles className={cn('size-7', tone.text)} aria-hidden />
      </div>
      <p className="font-medium">Coming soon</p>
      <p className="max-w-md text-sm text-muted-foreground">{upcoming}</p>
      <span className={cn('rounded-full px-2.5 py-0.5 font-mono text-xs', tone.tint, tone.text)}>{task}</span>
    </div>
  )
}
