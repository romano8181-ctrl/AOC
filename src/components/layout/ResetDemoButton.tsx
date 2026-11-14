import { RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useAocStore } from '@/store/useAocStore'

// FR-045, US-012 AC2: restore the original scenario after confirmation.
export function ResetDemoButton() {
  const resetDemo = useAocStore((s) => s.resetDemo)

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-sec-simulator/40 text-sec-simulator hover:bg-sec-simulator/15 hover:text-sec-simulator"
        >
          <RotateCcw aria-hidden />
          Reset demo data
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restore original scenario?</AlertDialogTitle>
          <AlertDialogDescription>
            All delays, cancellations, gate changes and events will be lost. The simulated day starts again at 12:00.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-sec-simulator text-[#2a0710] hover:bg-sec-simulator/90"
            onClick={() => {
              resetDemo()
              toast.success('Demo data restored')
            }}
          >
            Reset demo data
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
