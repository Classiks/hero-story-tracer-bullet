import { useEffect } from 'react'

export function useRefetchOnReturn({
  enabled,
  refetch,
}: {
  enabled: boolean
  refetch: () => void
}) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return
    }

    function handleReturn() {
      if (document.visibilityState === 'visible') {
        refetch()
      }
    }

    window.addEventListener('focus', handleReturn)
    document.addEventListener('visibilitychange', handleReturn)

    return () => {
      window.removeEventListener('focus', handleReturn)
      document.removeEventListener('visibilitychange', handleReturn)
    }
  }, [enabled, refetch])
}
