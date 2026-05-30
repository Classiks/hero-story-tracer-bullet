import { SupabaseAuthError, requireSupabaseUser } from '#/lib/supabase-server'
import { isUserLanguage, isUserTextModel } from '#/modules/user-settings'
import {
  getUserSettings,
  updateUserSettings,
  UserSettingsError,
} from '#/modules/user-settings.server'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/settings')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { supabase, user } = await requireSupabaseUser(request)
          return Response.json(await getUserSettings({ supabase, userId: user.id }))
        } catch (error) {
          return errorResponse(error)
        }
      },
      PATCH: async ({ request }) => {
        try {
          const { supabase, user } = await requireSupabaseUser(request)
          const input = await request.json()
          const hasTextModel =
            typeof input === 'object' && input !== null && Object.hasOwn(input, 'textModel')
          const hasSoundsEnabled =
            typeof input === 'object' && input !== null && Object.hasOwn(input, 'soundsEnabled')
          const hasLanguage =
            typeof input === 'object' && input !== null && Object.hasOwn(input, 'language')
          const textModel = hasTextModel ? input.textModel : undefined
          const soundsEnabled = hasSoundsEnabled ? input.soundsEnabled : undefined
          const language = hasLanguage ? input.language : undefined

          if (textModel !== undefined && textModel !== null && !isUserTextModel(textModel)) {
            return Response.json({ error: 'Valid textModel is required' }, { status: 400 })
          }

          if (language !== undefined && language !== null && !isUserLanguage(language)) {
            return Response.json({ error: 'Valid language is required' }, { status: 400 })
          }

          if (soundsEnabled !== undefined && typeof soundsEnabled !== 'boolean') {
            return Response.json({ error: 'Valid soundsEnabled is required' }, { status: 400 })
          }

          return Response.json(
            await updateUserSettings({
              language,
              soundsEnabled,
              supabase,
              textModel,
              userId: user.id,
            }),
          )
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
  },
})

function errorResponse(error: unknown) {
  if (error instanceof SupabaseAuthError || error instanceof UserSettingsError) {
    return Response.json({ error: error.message }, { status: error.status })
  }

  throw error
}
