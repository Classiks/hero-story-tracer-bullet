import { SupabaseAuthError, requireSupabaseUser } from '#/lib/supabase-server'
import {
  generatePersistedStoryImage,
  StoryServiceError,
} from '#/modules/story-flow/story-service.server'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/stories/$storyId/image')({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        try {
          const { supabase, user } = await requireSupabaseUser(request)
          const story = await generatePersistedStoryImage({
            storyId: params.storyId,
            supabase,
            userId: user.id,
          })

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
