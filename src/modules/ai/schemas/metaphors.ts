import z from "zod";

export const Metaphors = z.object({
  hero: z.string().describe("A concrete heroic metaphor for the user, written as a short noun phrase."),
  enemy: z.string().describe("A concrete metaphor for the user's challenge, written as a short noun phrase."),
  reward: z.string().describe("A concrete metaphor for what the user gains by pursuing the goal, written as a short noun phrase."),
}).describe("The core metaphor set that turns the user's task into a hero story.")

export const StoryBlueprint = z.object({
  title: z.string().describe("A short, display-ready title for this user's hero story."),
  storyBlurb: z.string().describe("A vivid 2-3 sentence motivational story setup addressed to the user."),
  callToAction: z.string().describe("A short sentence that invites the user to begin the next step."),
  metaphors: Metaphors,
}).describe("A mobile presentation-ready hero story blueprint for motivational task support.")

export type IMetaphors = z.infer<typeof Metaphors>
export type IStoryBlueprint = z.infer<typeof StoryBlueprint>
