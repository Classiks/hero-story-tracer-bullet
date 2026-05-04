import { StoryBlueprint, type IStoryBlueprint } from '#/modules/ai/schemas/metaphors'
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

export function createStoryBlueprintPrompt({
  challenge,
  goal,
  name,
}: {
  challenge: string
  goal: string
  name: string
}) {
  return `
Create a motivational hero-story blueprint for a task-support app.

The output will be shown directly to the user on a mobile screen. Make it vivid,
specific, and energizing without sounding like generic fantasy lore.

User:
- Name: ${name}
- Goal: ${goal}
- Challenge: ${challenge}

Rules:
- Address the user by name in the story blurb.
- Keep the title short and punchy.
- The metaphors must connect clearly to the actual goal and challenge.
- The enemy metaphor should make the challenge feel faceable, not hopeless.
- The reward metaphor should feel emotionally meaningful, not just material.
- The call to action should be one short sentence.
`
}

export function createStoryImagePrompt(blueprint: IStoryBlueprint) {
  return `
Create a wide 16:9 heroic fantasy banner illustration for this motivational story.

Title: ${blueprint.title}
Story: ${blueprint.storyBlurb}
Hero metaphor: ${blueprint.metaphors.hero}
Challenge metaphor: ${blueprint.metaphors.enemy}
Reward metaphor: ${blueprint.metaphors.reward}

Composition:
- Wide banner framing, strong central silhouette, readable on a phone.
- The hero should be moving toward or facing the challenge.
- Include a visual hint of the reward without cluttering the image.
- Cartoonish pixel-art inspired illustration with chunky shapes, clean silhouettes,
  simplified details, and warm storybook charm.
- Use a painterly pixel aesthetic, like a handcrafted animated short still, not a
  screenshot from a video game.
- Bright, adventurous lighting with clear color contrast, not dark or muddy.
- No text, no captions, no UI, no menus, no buttons, no icons, no health bars, no
  mana bars, no stats, no inventory, no minimap, no game HUD.
`
}
