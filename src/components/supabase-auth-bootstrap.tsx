import { ensureAnonymousSession } from '#/lib/supabase-auth'
import { useEffect } from 'react'

export function SupabaseAuthBootstrap() {
  useEffect(() => {
    void ensureAnonymousSession().catch((error) => {
      console.error('Failed to establish Supabase anonymous session', error)
    })
  }, [])

  return null
}
