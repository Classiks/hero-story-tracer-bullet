import { SupabaseAuthError, requireSupabaseUser } from '#/lib/supabase-server'
import { createPersistedQuest, StoryServiceError } from '#/modules/story-flow/story-service.server'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/stories/$storyId/quests')({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        try {
          const { supabase } = await requireSupabaseUser(request)
          const quest = await createPersistedQuest({ storyId: params.storyId, supabase })
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
