import z from "zod";

const MetaphorList = z.array(z.object({
  real: z.string().describe("The real-world task, obstacle, or concept."),
  metaphor: z.string().describe("The story-world metaphor used to represent it."),
})).describe("The key translations from real-world task language into story language.")

export const Metaphors = z.object({
  hero: z.string().describe("A concrete heroic metaphor for the user, written as a short noun phrase."),
  enemy: z.string().describe("A concrete metaphor for the user's challenge, written as a short noun phrase."),
  reward: z.string().describe("A concrete metaphor for what the user gains by pursuing the goal, written as a short noun phrase."),
}).describe("The core metaphor set that turns the user's task into a hero story.")

export const StoryBlueprint = z.object({
  title: z.string().describe("A short, display-ready title for this user's hero story."),
  storyBlurb: z.string().describe("A vivid 2-3 sentence motivational story setup addressed to the user."),
  metaphors: Metaphors,
}).describe("A mobile presentation-ready hero story blueprint for motivational task support.")

export const RecommendedTask = z.object({
  task: z.string().describe("One concrete next step the user can take now, written as a short action."),
  reasoning: z.string().describe("A concise explanation of why this task is a useful next step."),
}).describe("A hidden real-world task recommendation for the user's current goal and challenge.")

export const Quest = z.object({
  quest: z.string().describe("A short in-world quest title with no literal productivity terms unless they already belong to the story world."),
  content: z.string().describe("A 3-5 sentence immersive RPG-style quest brief with situation, stakes, immediate action, and emotional payoff."),
  action: z.string().describe("A short in-world action instruction the hero should take now."),
  metaphors: MetaphorList,
}).describe("A user-facing motivational quest generated from a recommended real-world task.")

export const QuestResultText = z.object({
  title: z.string().describe("A short in-world title for the story beat that follows a quest attempt."),
  text: z.string().describe("A compact in-world story bite showing what changed after the quest attempt."),
  reasoning: z.string().describe("A concise explanation of how the outcome and user feedback informed the story beat."),
  metaphors: MetaphorList
}).describe("A user-facing story beat generated from a quest outcome.")

export type IMetaphors = z.infer<typeof Metaphors>
export type IStoryBlueprint = z.infer<typeof StoryBlueprint>
export type IRecommendedTask = z.infer<typeof RecommendedTask>
export type IQuest = z.infer<typeof Quest>
export type IQuestResultText = z.infer<typeof QuestResultText>
