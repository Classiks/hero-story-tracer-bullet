import { SupabaseAuthError, requireSupabaseUser } from '#/lib/supabase-server'
import {
  createPersistedStory,
  listPersistedStories,
  StoryServiceError,
} from '#/modules/story-flow/story-service.server'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/stories/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { supabase } = await requireSupabaseUser(request)
          const stories = await listPersistedStories({ supabase })

          return Response.json(stories)
        } catch (error) {
          return errorResponse(error)
        }
      },
      POST: async ({ request }) => {
        try {
          const { supabase, user } = await requireSupabaseUser(request)
          const input = await request.json()

          if (
            typeof input.name !== 'string' ||
            typeof input.goal !== 'string' ||
            typeof input.challenge !== 'string'
          ) {
            return Response.json({ error: 'name, goal, and challenge are required' }, { status: 400 })
          }

          const name = input.name.trim()
          const goal = input.goal.trim()
          const challenge = input.challenge.trim()

          if (!name || !goal || !challenge) {
            return Response.json({ error: 'name, goal, and challenge are required' }, { status: 400 })
          }

          const story = await createPersistedStory({
            challenge,
            goal,
            name,
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
