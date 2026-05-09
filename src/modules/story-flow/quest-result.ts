import {
  QuestResultText,
  type IQuestResultText,
  type IQuestProposal,
  type IStoryBlueprint,
} from '#/modules/ai/schemas/metaphors'
import type { QuestFeedback, QuestOutcomeStatus } from '#/modules/story-flow/quest-outcome'
import {
  createQuestResultImagePrompt,
  createQuestResultTextPrompt,
} from '#/modules/story-flow/prompts'
import { useQuery } from '@tanstack/react-query'

export function useQuestResultTextQuery({
  challenge,
  enabled,
  feedback,
  goal,
  name,
  outcomeStatus,
  quest,
  storyBlueprint,
  task,
}: {
  challenge: string
  enabled: boolean
  feedback: QuestFeedback
  goal: string
  name: string
  outcomeStatus: QuestOutcomeStatus
  quest: IQuestProposal['quest'] | undefined
  storyBlueprint: IStoryBlueprint | undefined
  task: IQuestProposal['recommendedTask'] | undefined
}) {
  return useQuery({
    enabled,
    queryKey: [
      'quest-result-text',
      name,
      goal,
      challenge,
      storyBlueprint?.title,
      task?.task,
      quest?.quest,
      outcomeStatus,
      feedback.note,
    ],
    queryFn: async () => {
      if (!storyBlueprint || !task || !quest) {
        throw new Error('Story blueprint, task, and quest are required')
      }

      const response = await fetch('/api/generate/data', {
        method: 'POST',
        body: JSON.stringify({
          message: createQuestResultTextPrompt({
            challenge,
            feedback,
            goal,
            name,
            outcomeStatus,
            quest,
            storyBlueprint,
            task,
          }),
          schemaId: 'questResultText',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate quest result text')
      }

      return QuestResultText.parse(await response.json())
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity,
  })
}

export function useQuestResultImageQuery({
  enabled,
  outcomeStatus,
  quest,
  resultText,
  storyBlueprint,
}: {
  enabled: boolean
  outcomeStatus: QuestOutcomeStatus
  quest: IQuestProposal['quest'] | undefined
  resultText: IQuestResultText | undefined
  storyBlueprint: IStoryBlueprint | undefined
}) {
  return useQuery({
    enabled,
    queryKey: [
      'quest-result-image',
      storyBlueprint?.title,
      quest?.quest,
      resultText?.title,
      resultText?.text,
      outcomeStatus,
    ],
    queryFn: async () => {
      if (!storyBlueprint || !quest || !resultText) {
        throw new Error('Story blueprint, quest, and result text are required')
      }

      const response = await fetch('/api/generate/image', {
        method: 'POST',
        body: JSON.stringify({
          message: createQuestResultImagePrompt({ outcomeStatus, quest, resultText, storyBlueprint }),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate quest result image')
      }

      const content = await response.json()
      return content.image as string
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity,
  })
}
