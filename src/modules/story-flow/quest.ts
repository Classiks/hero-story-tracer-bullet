import {
  Quest,
  RecommendedTask,
  type IRecommendedTask,
  type IQuestProposal,
  type IStoryBlueprint,
} from '#/modules/ai/schemas/metaphors'
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

function createRecommendedTaskPrompt({
  challenge,
  goal,
  name,
  storyBlueprint,
}: {
  challenge: string
  goal: string
  name: string
  storyBlueprint: IStoryBlueprint
}) {
  return `
Choose one concrete next task for the user.

This result is hidden by default. It is used as reasoning input for a visible
story quest, so keep the task practical and directly useful.

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

Rules:
- Choose exactly one next step the user can take soon.
- Make it small enough to start without planning a whole project.
- The task must be complete, concrete, and immediately understandable.
- The task must include all needed details; never output a sentence fragment.
- The task must move the user toward the goal and account for the challenge.
- Do not invent personal history beyond the provided inputs.
- Reasoning should be concise and practical.
- Avoid vague branded ritual names unless they make the action clearer.
`
}

function createQuestPrompt({
  challenge,
  goal,
  name,
  storyBlueprint,
  task,
}: {
  challenge: string
  goal: string
  name: string
  storyBlueprint: IStoryBlueprint
  task: IRecommendedTask
}) {
  return `
Turn the recommended real-world task into a user-facing story quest.

This is the primary motivational moment in the app. The quest should make the
user feel identified with the hero and ready to act now.

The quest and content fields must live inside the story world. They should feel
like a compact World of Warcraft or Guild Wars 2 quest brief: a small story with
situation, pressure, immediate action, and emotional payoff. Do not expose the
recommendation reasoning or literal real-world task details in the visible quest
content.

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

Hidden recommended task:
- Task: ${task.task}
- Reasoning: ${task.reasoning}

Rules:
- quest: short in-world quest title. Do not use literal productivity terms.
- content: 3-5 sentences of immersive in-world quest text.
- content must establish the immediate story situation, name the pressure or threat, call the hero into action, and show what this small action changes.
- action: short, direct in-world instruction the hero should take now.
- action must be actionable while staying fully inside the story metaphor.
- metaphors: list the important real-world concepts and their story-world translations for the explanation dialog.
- The first metaphors item must map the complete real-world recommended task to the generated in-world action.
- Keep the story aligned with the base blurb; do not create a different world.
- The quest can vary its phrasing and metaphors even when the task stays the same.
- The metaphor must sharpen the real task, not hide it behind vague fantasy.
- Keep concrete real-world details out of quest, content, and action unless those exact words already belong to the story world.
- Banned from quest/content/action when they break immersion: coding, calendar, app, 25 minutes, distractions, task, schedule.
- Use in-world equivalents: timebox -> one focused watch or short vigil; project work -> shaping the relic, forgework, artifact; distraction -> whispers, fog, lures; procrastination or inertia -> the existing enemy pressing closer.
- Avoid arbitrary ritual titles, "begin the journey" phrasing, and incomplete task strings.
- Bad title: "Iron Will's 25-Minute Code Strike"
- Bad content: "Spend 25 minutes coding on your app, ignoring all distractions."
- Bad action: "Spend 25 minutes coding on your app, ignoring all distractions."
- Good title: "The First Strike at Dawn"
- Good content: "Iron Will, the forge has cooled beneath the Great Sloth's mist, but one coal still glows under the ash. The beast fattens on every unguarded hour, and its whispers grow louder when the hammer stays still. Take up the work for one focused watch and shape the relic one clean strike further. Let the fog learn that even a small flame can push it back."
- Good action: "Hold the forge for one focused watch, shaping the relic while the Sloth's whispers pass unanswered."
`
}
