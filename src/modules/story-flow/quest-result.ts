import {
  QuestResultText,
  type IQuestResultText,
  type IQuestProposal,
  type IStoryBlueprint,
} from '#/modules/ai/schemas/metaphors'
import { questOutcomeSucceeded, type QuestFeedback, type QuestOutcomeStatus } from '#/modules/story-flow/quest-outcome'
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

export function createQuestResultTextPrompt({
  challenge,
  feedback,
  goal,
  name,
  outcomeStatus,
  quest,
  storyBlueprint,
  task,
}: {
  challenge: string
  feedback: QuestFeedback
  goal: string
  name: string
  outcomeStatus: QuestOutcomeStatus
  quest: IQuestProposal['quest']
  storyBlueprint: IStoryBlueprint
  task: IQuestProposal['recommendedTask']
}) {
  const outcome = getOutcomePromptLabel(outcomeStatus)
  const userNote = feedback.note || 'No extra feedback was provided.'

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
  outcomeStatus,
  quest,
  resultText,
  storyBlueprint,
}: {
  outcomeStatus: QuestOutcomeStatus
  quest: IQuestProposal['quest']
  resultText: IQuestResultText
  storyBlueprint: IStoryBlueprint
}) {
  const outcomeDirection = questOutcomeSucceeded(outcomeStatus)
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
Outcome: ${getOutcomePromptLabel(outcomeStatus)}

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

function getOutcomePromptLabel(outcomeStatus: QuestOutcomeStatus) {
  switch (outcomeStatus) {
    case 'completed':
      return 'completed'
    case 'rejected':
      return 'rejected'
    case 'unresolved':
      return 'abandoned or failed'
  }
}
