import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
import type { Database } from '#/lib/database.types'

export class SupabaseAuthError extends Error {
  status = 401

  constructor(message = 'Supabase authentication is required') {
    super(message)
  }
}

export function getBearerToken(request: Request) {
  const authorization = request.headers.get('authorization')
  const match = authorization?.match(/^Bearer\s+(.+)$/i)
  return match?.[1] ?? null
}

export function createServerSupabaseClient(accessToken: string) {
  return createClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

export async function requireSupabaseUser(request: Request): Promise<{
  accessToken: string
  supabase: ReturnType<typeof createServerSupabaseClient>
  user: User
}> {
  const accessToken = getBearerToken(request)

  if (!accessToken) {
    throw new SupabaseAuthError()
  }

  const supabase = createServerSupabaseClient(accessToken)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken)

  if (error || !user) {
    throw new SupabaseAuthError(error?.message)
  }

  return { accessToken, supabase, user }
}

function getSupabaseUrl() {
  const value = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL

  if (!value) {
    throw new Error('SUPABASE_URL or VITE_SUPABASE_URL is required')
  }

  return value
}

function getSupabaseAnonKey() {
  const value =
    process.env.SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_KEY

  if (!value) {
    throw new Error('SUPABASE_ANON_KEY, VITE_SUPABASE_ANON_KEY, or VITE_SUPABASE_KEY is required')
  }

  return value
}
