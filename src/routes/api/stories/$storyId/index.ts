import { SupabaseAuthError, requireSupabaseUser } from '#/lib/supabase-server'
import {
  deletePersistedStory,
  getPersistedStory,
  StoryServiceError,
  updatePersistedStoryStatus,
} from '#/modules/story-flow/story-service.server'
import type { StoryStatus } from '#/modules/story-flow/persisted-types'
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
      PATCH: async ({ params, request }) => {
        try {
          const { supabase } = await requireSupabaseUser(request)
          const input = await request.json()

          if (!isStoryStatus(input.status)) {
            return Response.json({ error: 'Valid story status is required' }, { status: 400 })
          }

          const story = await updatePersistedStoryStatus({
            status: input.status,
            storyId: params.storyId,
            supabase,
          })

          return Response.json({ story })
        } catch (error) {
          return errorResponse(error)
        }
      },
      DELETE: async ({ params, request }) => {
        try {
          const { supabase } = await requireSupabaseUser(request)
          await deletePersistedStory({ storyId: params.storyId, supabase })
          return new Response(null, { status: 204 })
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
  },
})

function isStoryStatus(value: unknown): value is StoryStatus {
  return value === 'active' || value === 'completed' || value === 'archived'
}

function errorResponse(error: unknown) {
  if (error instanceof SupabaseAuthError || error instanceof StoryServiceError) {
    return Response.json({ error: error.message }, { status: error.status })
  }

  throw error
}
