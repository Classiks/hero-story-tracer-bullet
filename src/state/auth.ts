import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'

interface AuthState {
  error: string | null
  isExplicitlySignedOut: boolean
  isLoading: boolean
  session: Session | null
  user: User | null
  setAuthState: (state: Partial<Omit<AuthState, 'setAuthState'>>) => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  error: null,
  isExplicitlySignedOut: false,
  isLoading: true,
  session: null,
  user: null,
  setAuthState: (state) => set((current) => ({ ...current, ...state })),
}))
