import z from "zod";
import {
  DEFAULT_USER_LANGUAGE,
  getUserLanguagePromptName,
  type UserLanguage,
} from "#/modules/user-settings";

type SchemaOptions = {
  language: UserLanguage
}

const DEFAULT_SCHEMA_OPTIONS: SchemaOptions = { language: DEFAULT_USER_LANGUAGE }

function withOutputInstructions(description: string, { language }: SchemaOptions) {
  return `${description} Write this field in ${getUserLanguagePromptName(language)}.`
}

export function createMetaphorsSchema(options: SchemaOptions) {
  return z.object({
    hero: z.string().describe(withOutputInstructions("A concrete heroic metaphor for the user, written as a short noun phrase.", options)),
    enemy: z.string().describe(withOutputInstructions("A concrete metaphor for the user's challenge, written as a short noun phrase.", options)),
    reward: z.string().describe(withOutputInstructions("A concrete metaphor for what the user gains by pursuing the goal, written as a short noun phrase.", options)),
  }).describe("The core metaphor set that turns the user's task into a hero story.")
}

function createMetaphorListSchema(options: SchemaOptions) {
  return z.array(z.object({
    real: z.string().describe(withOutputInstructions("The real-world task, obstacle, or concept.", options)),
    metaphor: z.string().describe(withOutputInstructions("The story-world metaphor used to represent it.", options)),
  })).describe("The key translations from real-world task language into story language.")
}

export function createStoryBlueprintSchema(options: SchemaOptions) {
  return z.object({
    title: z.string().describe(withOutputInstructions("A short, display-ready title for this user's hero story.", options)),
    storyBlurb: z.string().describe(withOutputInstructions("A vivid 1-3 sentence motivational story setup addressed to the user; narrative, compact, and mobile-friendly.", options)),
    metaphors: createMetaphorsSchema(options),
  }).describe("A mobile presentation-ready hero story blueprint for motivational task support.")
}

export function createRecommendedTaskSchema(options: SchemaOptions) {
  return z.object({
    task: z.string().describe(withOutputInstructions("One concrete next step the user can take now, written as a short action.", options)),
    reasoning: z.string().describe(withOutputInstructions("A concise explanation of why this task is a useful next step.", options)),
  }).describe("A hidden real-world task recommendation for the user's current goal and challenge.")
}

export function createQuestSchema(options: SchemaOptions) {
  return z.object({
    quest: z.string().describe(withOutputInstructions("A short in-world quest title with no literal productivity terms unless they already belong to the story world.", options)),
    content: z.string().describe(withOutputInstructions("A 1-2 sentence immersive RPG-style quest brief with situation, stakes, immediate action, and emotional payoff.", options)),
    action: z.string().describe(withOutputInstructions("A brief, natural in-world action instruction the hero should take now; complete enough to be actionable.", options)),
    metaphors: createMetaphorListSchema(options),
  }).describe("A user-facing motivational quest generated from a recommended real-world task.")
}

export function createQuestProposalSchema(options: SchemaOptions) {
  return z.object({
    recommendedTask: createRecommendedTaskSchema(options),
    quest: createQuestSchema(options),
  }).describe("A complete quest proposal containing the hidden practical recommendation and visible story quest.")
}

export function createQuestResultTextSchema(options: SchemaOptions) {
  return z.object({
    title: z.string().describe(withOutputInstructions("A short in-world title for the story beat that follows a quest attempt.", options)),
    text: z.string().describe(withOutputInstructions("A compact 1-2 sentence in-world story bite showing what changed after the quest attempt.", options)),
    reasoning: z.string().describe(withOutputInstructions("A concise explanation of how the outcome and user feedback informed the story beat.", options)),
    metaphors: createMetaphorListSchema(options),
    completionSuggestion: z.object({
      shouldSuggest: z.boolean().describe("Whether the user should be invited to mark this whole story as complete."),
      reason: z.string().nullable().describe(withOutputInstructions("A short explanation of why this story may now be complete, or null when shouldSuggest is false.", options)),
    }).default({
      reason: null,
      shouldSuggest: false,
    }).describe("A suggestion to finish the full story arc after this quest result."),
  }).describe("A user-facing story beat generated from a quest outcome.")
}

export const Metaphors = createMetaphorsSchema(DEFAULT_SCHEMA_OPTIONS)
export const StoryBlueprint = createStoryBlueprintSchema(DEFAULT_SCHEMA_OPTIONS)
export const RecommendedTask = createRecommendedTaskSchema(DEFAULT_SCHEMA_OPTIONS)
export const Quest = createQuestSchema(DEFAULT_SCHEMA_OPTIONS)
export const QuestProposal = createQuestProposalSchema(DEFAULT_SCHEMA_OPTIONS)
export const QuestResultText = createQuestResultTextSchema(DEFAULT_SCHEMA_OPTIONS)

export type IMetaphors = z.infer<typeof Metaphors>
export type IStoryBlueprint = z.infer<typeof StoryBlueprint>
export type IRecommendedTask = z.infer<typeof RecommendedTask>
export type IQuest = z.infer<typeof Quest>
export type IQuestProposal = z.infer<typeof QuestProposal>
export type IQuestResultText = z.infer<typeof QuestResultText>
