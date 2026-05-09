import { StoryBlueprint, type IStoryBlueprint } from '#/modules/ai/schemas/metaphors'
import { createStoryBlueprintPrompt, createStoryImagePrompt } from '#/modules/story-flow/prompts'
import { useQuery } from '@tanstack/react-query'

export function useStoryBlueprintQuery({
  challenge,
  enabled,
  goal,
  name,
}: {
  challenge: string
  enabled: boolean
  goal: string
  name: string
}) {
  return useQuery({
    enabled,
    queryKey: ['story-blueprint', name, goal, challenge],
    queryFn: async () => {
      const response = await fetch('/api/generate/data', {
        method: 'POST',
        body: JSON.stringify({
          message: createStoryBlueprintPrompt({ challenge, goal, name }),
          schemaId: 'storyBlueprint',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate story blueprint')
      }

      return StoryBlueprint.parse(await response.json())
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity,
  })
}

export function useStoryImageQuery(blueprint: IStoryBlueprint | undefined) {
  const imageKey = blueprint
    ? [
        blueprint.title,
        blueprint.metaphors.hero,
        blueprint.metaphors.enemy,
        blueprint.metaphors.reward,
      ].join('|')
    : ''

  return useQuery({
    enabled: Boolean(blueprint),
    queryKey: ['story-image', imageKey],
    queryFn: async () => {
      if (!blueprint) {
        throw new Error('Story blueprint is required')
      }

      const response = await fetch('/api/generate/image', {
        method: 'POST',
        body: JSON.stringify({
          message: createStoryImagePrompt(blueprint),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate story image')
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
