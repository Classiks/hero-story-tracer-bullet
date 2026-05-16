import { SupabaseAuthError, requireSupabaseUser } from '#/lib/supabase-server'
import { getPersistedStory, StoryServiceError } from '#/modules/story-flow/story-service.server'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/stories/$storyId/')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        try {
          const { supabase } = await requireSupabaseUser(request)
          const story = await getPersistedStory({ storyId: params.storyId, supabase })
          return Response.json({ story })
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
