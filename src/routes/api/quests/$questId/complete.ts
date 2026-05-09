import { SupabaseAuthError, requireSupabaseUser } from '#/lib/supabase-server'
import { isQuestOutcomeStatus } from '#/modules/story-flow/quest-outcome'
import { completePersistedQuest, StoryServiceError } from '#/modules/story-flow/story-service.server'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/quests/$questId/complete')({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        try {
          const { supabase, user } = await requireSupabaseUser(request)
          const input = await request.json()

          if (!isQuestOutcomeStatus(input.outcomeStatus)) {
            return Response.json({ error: 'Valid outcomeStatus is required' }, { status: 400 })
          }

          const feedbackNote =
            input.feedback &&
            typeof input.feedback === 'object' &&
            !Array.isArray(input.feedback) &&
            typeof input.feedback.note === 'string'
              ? input.feedback.note.trim()
              : ''
          const feedback = feedbackNote ? { note: feedbackNote } : {}

          const quest = await completePersistedQuest({
            feedback,
            outcomeStatus: input.outcomeStatus,
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
