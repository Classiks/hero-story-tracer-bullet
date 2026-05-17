import { hasExplicitlySignedOut, ensureAnonymousSession } from '#/lib/supabase-auth'
import { supabase } from '#/lib/supabase'
import { useAuthStore } from '#/state/auth'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export function SupabaseAuthBootstrap() {
  const queryClient = useQueryClient()
  const setAuthState = useAuthStore((state) => state.setAuthState)

  useEffect(() => {
    let previousUserId: string | null | undefined

    void ensureAnonymousSession()
      .then((session) => {
        previousUserId = session?.user.id ?? null
        setAuthState({
          error: null,
          isExplicitlySignedOut: !session && hasExplicitlySignedOut(),
          isLoading: false,
          session,
          user: session?.user ?? null,
        })
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Failed to establish Supabase session'
        console.error('Failed to establish Supabase session', error)
        setAuthState({
          error: message,
          isExplicitlySignedOut: hasExplicitlySignedOut(),
          isLoading: false,
          session: null,
          user: null,
        })
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user.id ?? null

      if (previousUserId !== undefined && previousUserId !== nextUserId) {
        queryClient.clear()
      }

      previousUserId = nextUserId
      setAuthState({
        error: null,
        isExplicitlySignedOut: !session && hasExplicitlySignedOut(),
        isLoading: false,
        session,
        user: session?.user ?? null,
      })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [queryClient, setAuthState])

  return null
}
