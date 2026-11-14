import { useEffect } from 'react'
import { toast } from 'sonner'
import { useAocStore } from '@/store/useAocStore'

// US-012 AC3: if the saved state was invalid, the store fell back to the seed — tell the operator once.
export function StorageWarningToast() {
  const warning = useAocStore((s) => s.storageWarning)
  const clear = useAocStore((s) => s.clearStorageWarning)

  useEffect(() => {
    if (!warning) return
    // Fixed id: React StrictMode runs effects twice in dev; sonner shows one toast per id.
    toast.warning(warning, { id: 'storage-warning' })
    clear()
  }, [warning, clear])

  return null
}
