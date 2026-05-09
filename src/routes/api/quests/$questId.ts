import { SupabaseAuthError, requireSupabaseUser } from '#/lib/supabase-server'
import { getPersistedQuest, StoryServiceError } from '#/modules/story-flow/story-service.server'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/quests/$questId')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        try {
          const { supabase } = await requireSupabaseUser(request)
          const quest = await getPersistedQuest({ questId: params.questId, supabase })
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
