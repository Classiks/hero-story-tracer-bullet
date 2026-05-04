import {
  QuestResultText,
  type IQuest,
  type IQuestResultText,
  type IRecommendedTask,
  type IStoryBlueprint,
} from '#/modules/ai/schemas/metaphors'
import { useQuery } from '@tanstack/react-query'

export function useQuestResultTextQuery({
  challenge,
  enabled,
  goal,
  name,
  note,
  quest,
  storyBlueprint,
  success,
  task,
}: {
  challenge: string
  enabled: boolean
  goal: string
  name: string
  note: string
  quest: IQuest | undefined
  storyBlueprint: IStoryBlueprint | undefined
  success: boolean
  task: IRecommendedTask | undefined
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
      success,
      note,
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
            goal,
            name,
            note,
            quest,
            storyBlueprint,
            success,
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
  quest,
  resultText,
  storyBlueprint,
  success,
}: {
  enabled: boolean
  quest: IQuest | undefined
  resultText: IQuestResultText | undefined
  storyBlueprint: IStoryBlueprint | undefined
  success: boolean
}) {
  return useQuery({
    enabled,
    queryKey: [
      'quest-result-image',
      storyBlueprint?.title,
      quest?.quest,
      resultText?.title,
      resultText?.text,
      success,
    ],
    queryFn: async () => {
      if (!storyBlueprint || !quest || !resultText) {
        throw new Error('Story blueprint, quest, and result text are required')
      }

      const response = await fetch('/api/generate/image', {
        method: 'POST',
        body: JSON.stringify({
          message: createQuestResultImagePrompt({ quest, resultText, storyBlueprint, success }),
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

export function createQuestResultTextPrompt({
  challenge,
  goal,
  name,
  note,
  quest,
  storyBlueprint,
  success,
  task,
}: {
  challenge: string
  goal: string
  name: string
  note: string
  quest: IQuest
  storyBlueprint: IStoryBlueprint
  success: boolean
  task: IRecommendedTask
}) {
  const outcome = success ? 'completed' : 'abandoned or failed'
  const userNote = note || 'No extra feedback was provided.'

  return `
Write the next short story beat after a user attempted a quest.

This result is shown directly to the user. It should feel like a compact chapter
fragment in the same hero story, similar in purpose to the initial story blurb,
but focused on what happened because of this quest attempt.

User:
- Name: ${name}
- Goal: ${goal}
- Challenge: ${challenge}

Story context:
- Title: ${storyBlueprint.title}
- Blurb: ${storyBlueprint.storyBlurb}
- Hero: ${storyBlueprint.metaphors.hero}
- Challenge metaphor: ${storyBlueprint.metaphors.enemy}
- Reward: ${storyBlueprint.metaphors.reward}

Quest attempted:
- Quest title: ${quest.quest}
- Quest brief: ${quest.content}
- Quest action: ${quest.action}
- Hidden real-world task: ${task.task}
- Hidden task reasoning: ${task.reasoning}

Outcome:
- Result: ${outcome}
- User feedback note: ${userNote}

Rules:
- title: short in-world title for this story beat.
- text: 3-6 sentences, immersive, readable, and part of the larger story.
- metaphors: list the important real-world concepts and their story-world translations for this result beat.
- The first metaphors item must map the concrete quest outcome to the main story-world change in the generated text.
- Include mappings for user feedback from the note when it materially affects the story beat.
- If the quest was completed, show a small but meaningful change in the world.
- If the quest was abandoned or failed, show a setback or unresolved pressure without shaming the user.
- Treat the user note as factual feedback about how the attempt went, but do not quote it mechanically.
- Keep the story aligned with the original world, hero, enemy, and reward.
- Do not generate a new quest or direct next task here.
- Do not expose hidden recommendation reasoning or literal productivity terms unless they already belong naturally in the story world.
- The beat should make the next quest feel possible, not finished.
- reasoning should briefly explain how the outcome and note shaped the generated beat.
`
}

export function createQuestResultImagePrompt({
  quest,
  resultText,
  storyBlueprint,
  success,
}: {
  quest: IQuest
  resultText: IQuestResultText
  storyBlueprint: IStoryBlueprint
  success: boolean
}) {
  const outcomeDirection = success
    ? 'Show a small visible victory, changed landscape, rekindled light, or progress after action.'
    : 'Show tension, retreat, an unresolved obstacle, or a dim but surviving light; avoid bleak final defeat.'

  return `
Create a wide 16:9 heroic fantasy illustration for this story moment.

Story title: ${storyBlueprint.title}
Original story: ${storyBlueprint.storyBlurb}
Hero metaphor: ${storyBlueprint.metaphors.hero}
Challenge metaphor: ${storyBlueprint.metaphors.enemy}
Reward metaphor: ${storyBlueprint.metaphors.reward}
Quest attempted: ${quest.quest}
Result beat title: ${resultText.title}
Result beat: ${resultText.text}
Result beat metaphors:
${resultText.metaphors
  .map((metaphor) => `- ${metaphor.real} -> ${metaphor.metaphor}`)
  .join('\n')}
Outcome: ${success ? 'completed' : 'abandoned or failed'}

Composition:
- Wide banner framing, readable on a phone.
- Show the hero in the same story world after the quest attempt.
- ${outcomeDirection}
- Include a visual hint that the larger journey continues.
- Cartoonish pixel-art inspired illustration with chunky shapes, clean silhouettes,
  simplified details, and warm storybook charm.
- Use a painterly pixel aesthetic, like a handcrafted animated short still, not a
  screenshot from a video game.
- Clear color contrast, not dark or muddy.
- No text, no captions, no UI, no menus, no buttons, no icons, no health bars, no
  mana bars, no stats, no inventory, no minimap, no game HUD.
`
}
