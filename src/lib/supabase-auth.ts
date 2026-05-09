import { supabase } from '#/lib/supabase'

export async function ensureAnonymousSession() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    throw sessionError
  }

  if (session) {
    return session
  }

  const {
    data: { session: anonymousSession },
    error: signInError,
  } = await supabase.auth.signInAnonymously()

  if (signInError) {
    throw signInError
  }

  return anonymousSession
}
