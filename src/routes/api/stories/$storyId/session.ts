import { SupabaseAuthError, requireSupabaseUser } from '#/lib/supabase-server'
import { getStorySession, StoryServiceError } from '#/modules/story-flow/story-service.server'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/stories/$storyId/session')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        try {
          const { supabase } = await requireSupabaseUser(request)
          const session = await getStorySession({ storyId: params.storyId, supabase })
          return Response.json(session)
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
