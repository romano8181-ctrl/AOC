import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { getSection, type SectionKey } from './navItems'

interface PageHeaderProps {
  /** Section whose icon and color the header uses. */
  section: SectionKey
  title: string
  description?: string
  /** Optional right-side content, e.g. counters or actions. */
  actions?: ReactNode
}

export function PageHeader({ section, title, description, actions }: PageHeaderProps) {
  const { icon: Icon, tone } = getSection(section)
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className={cn('flex size-12 shrink-0 items-center justify-center rounded-xl', tone.tint)}>
          <Icon className={cn('size-6', tone.text)} aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions}
    </div>
  )
}
