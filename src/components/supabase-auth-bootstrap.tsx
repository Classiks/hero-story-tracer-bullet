import {
  ensureAnonymousSession,
  hasExplicitlySignedOut,
  hasSupabaseAuthRedirectInUrl,
} from '#/lib/supabase-auth'
import { supabase } from '#/lib/supabase'
import { useAuthStore } from '#/state/auth'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export function SupabaseAuthBootstrap() {
  const queryClient = useQueryClient()
  const setAuthState = useAuthStore((state) => state.setAuthState)

  useEffect(() => {
    let previousUserId: string | null | undefined

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUserId = session?.user.id ?? null

      if (previousUserId !== undefined && previousUserId !== nextUserId) {
        queryClient.clear()
      }

      previousUserId = nextUserId
      setAuthState({
        error: null,
        isExplicitlySignedOut: !session && hasExplicitlySignedOut(),
        isLoading: false,
        isPasswordRecovery: event === 'PASSWORD_RECOVERY',
        session,
        user: session?.user ?? null,
      })
    })

    if (!hasSupabaseAuthRedirectInUrl()) {
      void ensureAnonymousSession()
        .then((session) => {
          previousUserId = session?.user.id ?? null
          setAuthState({
            error: null,
            isExplicitlySignedOut: !session && hasExplicitlySignedOut(),
            isLoading: false,
            isPasswordRecovery: false,
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
            isPasswordRecovery: false,
            session: null,
            user: null,
          })
        })
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [queryClient, setAuthState])

  return null
}
