import { ensureAnonymousSession } from '#/lib/supabase-auth'

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const session = await ensureAnonymousSession()

  if (!session) {
    return new Response(JSON.stringify({ error: 'Supabase session is required' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 401,
    })
  }

  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${session.access_token}`)

  return fetch(input, {
    ...init,
    headers,
  })
}
