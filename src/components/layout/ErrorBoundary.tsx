import { Component, type ErrorInfo, type ReactNode } from 'react'
import { OctagonAlert, RefreshCw, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAocStore } from '@/store/useAocStore'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Changing this key (e.g. the route) clears the error. */
  resetKey?: string
}

interface ErrorBoundaryState {
  error: Error | null
}

// PRD 12.4: an unexpected render error never leaves a blank screen during the demo.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AOC render error', error, info.componentStack)
  }

  componentDidUpdate(prev: ErrorBoundaryProps) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  private resetDemo = () => {
    useAocStore.getState().resetDemo()
    this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="mx-auto mt-16 flex max-w-md flex-col items-center gap-4 rounded-xl border bg-card/80 p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-status-critical/15">
          <OctagonAlert className="size-6 text-status-critical" aria-hidden />
        </span>
        <div>
          <p className="font-semibold">Something went wrong</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This screen hit an unexpected error. Restore the demo data or reload the page.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw aria-hidden />
            Reload
          </Button>
          <Button onClick={this.resetDemo}>
            <RotateCcw aria-hidden />
            Reset demo data
          </Button>
        </div>
      </div>
    )
  }
}
