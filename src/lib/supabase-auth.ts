import { supabase } from '#/lib/supabase'

const EXPLICIT_SIGN_OUT_KEY = 'hero-story:explicit-sign-out'

export function hasExplicitlySignedOut() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(EXPLICIT_SIGN_OUT_KEY) === 'true'
}

function setExplicitlySignedOut(value: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  if (value) {
    window.localStorage.setItem(EXPLICIT_SIGN_OUT_KEY, 'true')
    return
  }

  window.localStorage.removeItem(EXPLICIT_SIGN_OUT_KEY)
}

export async function getCurrentSession() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    throw sessionError
  }

  return session
}

export async function ensureAnonymousSession() {
  const session = await getCurrentSession()

  if (session) {
    return session
  }

  if (hasExplicitlySignedOut()) {
    return null
  }

  return continueAnonymously()
}

export async function continueAnonymously() {
  setExplicitlySignedOut(false)

  const existingSession = await getCurrentSession()

  if (existingSession) {
    return existingSession
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

export async function upgradeAnonymousUser({
  email,
  password,
}: {
  email: string
  password: string
}) {
  const session = await getCurrentSession()

  if (!session) {
    throw new Error('Start an anonymous session before saving stories to an account.')
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.updateUser({ email, password })

  if (error) {
    throw error
  }

  setExplicitlySignedOut(false)
  return user
}

export async function signInWithEmailPassword({
  email,
  password,
}: {
  email: string
  password: string
}) {
  const {
    data: { session },
    error,
  } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    throw error
  }

  setExplicitlySignedOut(false)
  return session
}

export async function signOutOfPermanentAccount() {
  setExplicitlySignedOut(true)

  const { error } = await supabase.auth.signOut()

  if (error) {
    setExplicitlySignedOut(false)
    throw error
  }
}
