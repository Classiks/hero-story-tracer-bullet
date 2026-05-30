import type {
  IQuest,
  IQuestProposal,
  IQuestResultText,
  IRecommendedTask,
  IStoryBlueprint,
} from '#/modules/ai/schemas/metaphors'
import {
  questOutcomeSucceeded,
  type QuestFeedback,
  type QuestOutcomeStatus,
} from '#/modules/story-flow/quest-outcome'
import { getUserLanguagePromptName, type UserLanguage } from '#/modules/user-settings'

export function createStoryBlueprintPrompt({
  challenge,
  goal,
  language,
  name,
  priorStoryContext,
}: {
  challenge: string
  goal: string
  language: UserLanguage
  name: string
  priorStoryContext?: string
}) {
  return `
Create a motivational hero-story blueprint for a task-support app.

The output will be shown directly to the user on a mobile screen. Make it vivid,
specific, and energizing without sounding like generic fantasy lore.

User:
- Name: ${name}
- Goal: ${goal}
- Challenge: ${challenge}

Previous stories shown to this user:
${priorStoryContext || '- No previous stories yet.'}

${createOutputLanguageRule({ language })}

Rules:
- Address the user by name in the story blurb.
- Keep the title short and punchy.
- The story blurb should be 1-3 narrative sentences, written for a short mobile attention span.
- If the blurb uses 3 sentences, each sentence must be concise; if it uses 1 sentence, it may be a little richer.
- The metaphors must connect clearly to the actual goal and challenge.
- The enemy metaphor should make the challenge feel faceable, not hopeless.
- The reward metaphor should feel emotionally meaningful, not just material.
- If this goal and challenge resemble a previous story, it is encouraged to reuse, derive, or echo that story's themes and metaphors so the user feels continuity.
- If this goal or challenge is materially different from previous stories, choose fresh framing and do not reuse the same metaphors.
- Use previous stories as context for continuity decisions, not as lore that must be recapped.
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

export function createRecommendedTaskPrompt({
  challenge,
  continuityContext,
  goal,
  language,
  name,
  storyBlueprint,
}: {
  challenge: string
  continuityContext?: string
  goal: string
  language: UserLanguage
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

Story continuity context:
${continuityContext || '- No prior quests yet.'}

${createOutputLanguageRule({ language })}

Rules:
- Choose exactly one next step the user can take soon.
- Make it small enough to start without planning a whole project.
- The task must be complete, concrete, and immediately understandable.
- The task must include all needed details; never output a sentence fragment.
- The task must move the user toward the goal and account for the challenge.
- Do not invent personal history beyond the provided inputs.
- Avoid repeating a recent completed or unresolved quest unless the continuity context makes
  a direct retry clearly useful.
- Use the continuity context to choose the next practical step, but prioritize the user's current goal and
  challenge over elaborate plot callbacks.
- Reasoning should be concise and practical.
- Avoid vague branded ritual names unless they make the action clearer.
`
}

export function createQuestPrompt({
  challenge,
  continuityContext,
  goal,
  language,
  name,
  storyBlueprint,
  task,
}: {
  challenge: string
  continuityContext?: string
  goal: string
  language: UserLanguage
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

Story continuity context:
${continuityContext || '- No prior quests yet.'}

${createOutputLanguageRule({ language })}

Rules:
- quest: short in-world quest title. Do not use literal productivity terms.
- content: 1-2 narrative in-world sentences, compact but still story-like.
- content must establish the immediate story situation, name the pressure or threat, call the hero into action, and show what this small action changes.
- action: brief, natural in-world instruction the hero should take now.
- action must be complete, motivating, and actionable while staying fully inside the story metaphor; do not make it artificially terse.
- metaphors: list the important real-world concepts and their story-world translations for the explanation dialog.
- The first metaphors item must map the complete real-world recommended task to the generated in-world action.
- Treat the hero, challenge metaphor, and reward as canon. They are the spine of the story.
- Build from the continuity context. The quest should feel like the next chapter after the latest known story beat.
- Prefer evolving existing story elements over introducing new lore.
- Do not introduce a new named actor, place, faction, authority, artifact, or obstacle unless the visible content explains how it relates to the existing hero, enemy, reward, or a prior quest outcome.
- If a new obstacle appears, frame it as a face of the existing challenge metaphor or as a consequence of the current story state.
- Keep the story aligned with the base blurb; do not create a different world, genre, or premise.
- Let continuity influence framing and avoid repeating the same quest framing, but do not recap the whole history.
- The quest can vary phrasing, but variation must not break established canon.
- The metaphor must sharpen the real task, not hide it behind vague fantasy.
- Keep concrete real-world details out of quest, content, and action unless those exact words already belong to the story world.
- Banned from quest/content/action when they break immersion: coding, calendar, app, 25 minutes, distractions, task, schedule.
- Use in-world equivalents: timebox -> one focused watch or short vigil; project work -> shaping the relic, forgework, artifact; distraction -> whispers, fog, lures; procrastination or inertia -> the existing enemy pressing closer.
- Avoid arbitrary ritual titles, "begin the journey" phrasing, and incomplete task strings.
- Bad title: "Iron Will's 25-Minute Code Strike"
- Bad content: "Spend 25 minutes coding on your app, ignoring all distractions."
- Bad action: "Spend 25 minutes coding on your app, ignoring all distractions."
- Good title: "The First Strike at Dawn"
- Good content: "Iron Will, the forge has cooled beneath the Great Sloth's mist, but one coal still glows under the ash; take up one focused watch and shape the relic one clean strike further."
- Good action: "Hold the forge for one focused watch, shaping the relic while the Sloth's whispers pass unanswered."
`
}

export function createQuestResultTextPrompt({
  challenge,
  continuityContext,
  feedback,
  goal,
  language,
  name,
  outcomeStatus,
  quest,
  storyBlueprint,
  task,
}: {
  challenge: string
  continuityContext?: string
  feedback: QuestFeedback
  goal: string
  language: UserLanguage
  name: string
  outcomeStatus: QuestOutcomeStatus
  quest: IQuestProposal['quest'] | IQuest
  storyBlueprint: IStoryBlueprint
  task: IQuestProposal['recommendedTask'] | IRecommendedTask
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

Story continuity before this quest:
${continuityContext || '- No prior quests yet.'}

Quest attempted:
- Quest title: ${quest.quest}
- Quest brief: ${quest.content}
- Quest action: ${quest.action}
- Hidden real-world task: ${task.task}
- Hidden task reasoning: ${task.reasoning}

Outcome:
- Result: ${outcome}
- User feedback note: ${userNote}

${createOutputLanguageRule({ language })}

Rules:
- title: short in-world title for this story beat.
- text: 1-2 narrative in-world sentences, immersive and readable without becoming a long chapter.
- metaphors: list the important real-world concepts and their story-world translations for this result beat.
- completionSuggestion.shouldSuggest: true only when this result indicates the overall story arc may now be complete and the user should be invited to mark the story complete.
- completionSuggestion.reason: short user-facing rationale for the suggestion, or null when shouldSuggest is false.
- The first metaphors item must map the concrete quest outcome to the main story-world change in the generated text.
- Include mappings for user feedback from the note when it materially affects the story beat.
- If the quest was completed, show a small but meaningful change in the world.
- If the quest was abandoned or failed, show a setback or unresolved pressure without shaming the user.
- A completion suggestion is allowed after any outcome status when the user feedback note says or clearly implies that the real-world goal/story is done, no longer relevant, or ready to close.
- Otherwise, suggest completion only when the continuity context and this result make the larger goal arc feel narratively resolved, not merely because one quest succeeded.
- Treat the user note as factual feedback about how the attempt went, but do not quote it mechanically.
- Treat the hero, challenge metaphor, and reward as canon. They are the spine of the story.
- Build from the continuity context and the attempted quest. The beat should feel like the next chapter, not an isolated vignette.
- Prefer evolving existing story elements over introducing new lore.
- Do not introduce a new named actor, place, faction, authority, artifact, or obstacle unless the text explains how it relates to the existing hero, enemy, reward, or a prior quest outcome.
- If a new obstacle appears, frame it as a face of the existing challenge metaphor or as a consequence of the current story state.
- Keep the story aligned with the original world, hero, enemy, and reward.
- Do not generate a new quest or direct next task here.
- Do not expose hidden recommendation reasoning or literal productivity terms unless they already belong naturally in the story world.
- Unless completionSuggestion.shouldSuggest is true, the beat should make the next quest feel possible, not finished.
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
  quest: IQuestProposal['quest'] | IQuest
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

export function createOutputLanguageRule({ language }: { language: UserLanguage }) {
  const promptName = getUserLanguagePromptName(language)

  return `Output language:
- Write every generated string field in ${promptName}.
- The selected language setting overrides the language of the user's Goal, Challenge, Name, prior generated text, and feedback note.
- Use Story context, Story continuity context, prior generated text, status names, fixed English UI labels such as "Rejected because", and User feedback note as content references only, not as language-selection evidence.
`
}
