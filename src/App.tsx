import { PlaneTakeoff } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// T-01 placeholder: verifies Tailwind, shadcn/ui, theme tokens and toasts.
// Replaced by AppShell + routes in T-02.
export default function App() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <PlaneTakeoff className="size-5" aria-hidden />
            <span className="font-mono text-sm tracking-wider">AUR · AOC</span>
          </div>
          <CardTitle>Airport Operations Center</CardTitle>
          <CardDescription>Educational simulation — project scaffold is ready.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-status-ok/15 text-status-ok">ON TIME</Badge>
            <Badge className="bg-status-warn/15 text-status-warn">DELAYED</Badge>
            <Badge className="bg-status-info/15 text-status-info">BOARDING</Badge>
            <Badge className="bg-status-critical/15 text-status-critical">CANCELLED</Badge>
          </div>
          <p className="font-mono text-2xl tabular-nums">12:00 SIM</p>
          <Button onClick={() => toast.success('Scaffold works')}>Test toast</Button>
        </CardContent>
      </Card>
    </main>
  )
}
