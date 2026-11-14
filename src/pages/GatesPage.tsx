import { useMemo, useState } from 'react'
import { GateDetailsSheet } from '@/components/gates/GateDetailsSheet'
import { GateGrid } from '@/components/gates/GateGrid'
import { GateRequiredList } from '@/components/gates/GateRequiredList'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusPill } from '@/components/StatusPill'
import { Switch } from '@/components/ui/switch'
import type { GateState } from '@/domain/types'
import { useGateRequired, useGateSummaries } from '@/store/selectors'

const LEGEND: GateState[] = ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'UNAVAILABLE']

// PRD 12.3 Gates: legend + "available only", grid by terminal, gate required list, gate sheet.
export function GatesPage() {
  const summaries = useGateSummaries()
  const required = useGateRequired()
  const [availableOnly, setAvailableOnly] = useState(false)
  const [openGateId, setOpenGateId] = useState<string | null>(null)

  const visible = useMemo(
    () => (availableOnly ? summaries.filter((s) => s.state === 'AVAILABLE') : summaries),
    [summaries, availableOnly],
  )
  const availableCount = summaries.filter((s) => s.state === 'AVAILABLE').length

  return (
    <>
      <PageHeader section="gates" title="Gates" description="Gate states, assignments and conflicts." />
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border bg-card/80 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs tracking-wide text-muted-foreground uppercase">Legend</span>
            {LEGEND.map((s) => (
              <StatusPill key={s} status={s} />
            ))}
            <StatusPill status="CONFLICT" />
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <Switch
              id="available-only"
              checked={availableOnly}
              onCheckedChange={setAvailableOnly}
              className="data-[state=checked]:bg-status-ok"
            />
            <label htmlFor="available-only" className="cursor-pointer">
              Show available only <span className="text-muted-foreground">({availableCount})</span>
            </label>
          </div>
        </div>

        <GateRequiredList items={required} />
        <GateGrid summaries={visible} onOpen={setOpenGateId} />
      </div>
      <GateDetailsSheet gateId={openGateId} onClose={() => setOpenGateId(null)} />
    </>
  )
}
