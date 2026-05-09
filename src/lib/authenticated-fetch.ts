import { supabase } from '#/lib/supabase'

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  if (!session) {
    throw new Error('Supabase session is required')
  }

  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${session.access_token}`)

  return fetch(input, {
    ...init,
    headers,
  })
}
