import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts'
import type { GateUtilization } from '@/domain/kpi'
import { formatDuration } from '@/domain/time'
import type { Gate } from '@/domain/types'

interface GateUtilizationChartProps {
  data: GateUtilization[]
  gates: Gate[]
}

type Row = GateUtilization & { closed: boolean }

function GateTooltip({ active, payload }: TooltipProps<number, string>) {
  const row = payload?.[0]?.payload as Row | undefined
  if (!active || !row) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="font-mono text-sm font-semibold">Gate {row.gateId}</p>
      <p className="text-muted-foreground">
        {row.percent}% · {formatDuration(row.minutes)} of 16h
      </p>
      {row.closed && <p className="text-status-neutral">Closed</p>}
    </div>
  )
}

// FR-040: magnitude per gate → one hue (teal), one axis 0–100%, recessive grid, hover tooltip.
export function GateUtilizationChart({ data, gates }: GateUtilizationChartProps) {
  const rows: Row[] = data.map((d) => ({ ...d, closed: gates.find((g) => g.id === d.gateId)?.isClosed ?? false }))
  const busiest = rows.reduce((a, b) => (b.percent > a.percent ? b : a), rows[0])
  const avg = rows.length ? Math.round((rows.reduce((s, r) => s + r.percent, 0) / rows.length) * 10) / 10 : 0

  return (
    <section className="rounded-xl border bg-card/80 p-5" aria-labelledby="gate-util-title">
      <h2 id="gate-util-title" className="font-semibold">
        Gate utilization
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Share of 06:00–22:00 each gate is occupied · average {avg}%
        {busiest && busiest.percent > 0 ? ` · busiest ${busiest.gateId} (${busiest.percent}%)` : ''}
      </p>
      {rows.every((r) => r.minutes === 0) ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No gate occupancy to show.</p>
      ) : (
        <div className="h-56" role="img" aria-label={`Gate utilization, average ${avg} percent`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -16 }} barCategoryGap={6}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
              <XAxis
                dataKey="gateId"
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(v: number) => `${v}%`}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              />
              <Tooltip content={<GateTooltip />} cursor={{ fill: 'var(--accent)', opacity: 0.5 }} />
              <Bar dataKey="percent" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false}>
                {rows.map((r) => (
                  <Cell key={r.gateId} fill={r.closed ? 'var(--status-neutral)' : 'var(--sec-gates)'} fillOpacity={r.closed ? 0.35 : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <table className="sr-only">
        <caption>Gate utilization by gate</caption>
        <thead>
          <tr>
            <th>Gate</th>
            <th>Utilization</th>
            <th>Occupied</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.gateId}>
              <td>{r.gateId}</td>
              <td>{r.percent}%</td>
              <td>{formatDuration(r.minutes)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
