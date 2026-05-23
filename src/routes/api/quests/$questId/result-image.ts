import { SupabaseAuthError, requireSupabaseUser } from '#/lib/supabase-server'
import {
  generatePersistedQuestResultImage,
  StoryServiceError,
} from '#/modules/story-flow/story-service.server'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/quests/$questId/result-image')({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        try {
          const { supabase, user } = await requireSupabaseUser(request)
          const quest = await generatePersistedQuestResultImage({
            questId: params.questId,
            supabase,
            userId: user.id,
          })

          return Response.json({ quest })
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
  },
})

function errorResponse(error: unknown) {
  if (error instanceof SupabaseAuthError || error instanceof StoryServiceError) {
    return Response.json({ error: error.message }, { status: error.status })
  }

  throw error
}
