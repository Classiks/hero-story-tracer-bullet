import z from "zod";

export const Metaphors = z.object({
  hero: z.string().describe("A motivating figure the user can identify themselves with."),
  enemy: z.string().describe("A metaphor of the challenge they face. Like a Dragon, giant Serpant, Mountain to climb, ..."),
  reward: z.string().describe("What they gain by completing the journey, Once again as a metaphor: money = treasure, making friends = join a group, helping someone = rescueing someone"),
}).describe("In a mystic tone. Magic, Dragons, fantasy")

export type IMetaphors = z.infer<typeof Metaphors>
