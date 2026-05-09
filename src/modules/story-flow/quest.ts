import {
  Quest,
  RecommendedTask,
  type IQuestProposal,
  type IStoryBlueprint,
} from '#/modules/ai/schemas/metaphors'
import { createQuestPrompt, createRecommendedTaskPrompt } from '#/modules/story-flow/prompts'
import { useQuery } from '@tanstack/react-query'

export function useQuestProposalQuery({
  challenge,
  enabled,
  goal,
  name,
  storyBlueprint,
}: {
  challenge: string
  enabled: boolean
  goal: string
  name: string
  storyBlueprint: IStoryBlueprint | undefined
}) {
  return useQuery({
    enabled,
    queryKey: ['quest-proposal', name, goal, challenge, storyBlueprint?.title],
    queryFn: async (): Promise<IQuestProposal> => {
      if (!storyBlueprint) {
        throw new Error('Story blueprint is required')
      }

      const taskResponse = await fetch('/api/generate/data', {
        method: 'POST',
        body: JSON.stringify({
          message: createRecommendedTaskPrompt({ challenge, goal, name, storyBlueprint }),
          schemaId: 'recommendedTask',
        }),
      })

      if (!taskResponse.ok) {
        throw new Error('Failed to generate recommended task')
      }

      const recommendedTask = RecommendedTask.parse(await taskResponse.json())

      const questResponse = await fetch('/api/generate/data', {
        method: 'POST',
        body: JSON.stringify({
          message: createQuestPrompt({ challenge, goal, name, storyBlueprint, task: recommendedTask }),
          schemaId: 'quest',
        }),
      })

      if (!questResponse.ok) {
        throw new Error('Failed to generate quest')
      }

      return {
        recommendedTask,
        quest: Quest.parse(await questResponse.json()),
      }
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
    retry: false,
    staleTime: Infinity,
  })
}
