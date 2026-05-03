import z from "zod";

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

export const QuestQuestion = z.object({
  quest: z.string().describe("A short, display-ready quest title."),
  content: z.string().describe("A story-aligned question or prompt that invites the user into the quest."),
  task: z.string().describe("The plain real-world action being represented by the quest."),
  metaphors: z.array(z.object({
    real: z.string().describe("The real-world task, obstacle, or concept."),
    metaphor: z.string().describe("The story-world metaphor used to represent it."),
  })).describe("The key translations from real-world task language into story language."),
}).describe("A user-facing quest question generated from a recommended real-world task.")

export type IMetaphors = z.infer<typeof Metaphors>
export type IStoryBlueprint = z.infer<typeof StoryBlueprint>
export type IRecommendedTask = z.infer<typeof RecommendedTask>
export type IQuestQuestion = z.infer<typeof QuestQuestion>
