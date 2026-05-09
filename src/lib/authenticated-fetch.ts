import { ensureAnonymousSession } from '#/lib/supabase-auth'

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const session = await ensureAnonymousSession()

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
