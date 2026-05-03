import { ZodType } from "zod";
import { Metaphors, Quest, RecommendedTask, StoryBlueprint } from "./metaphors";

type availableSchemas = "metaphors" | "storyBlueprint" | "recommendedTask" | "quest"
const schemaMap: Record<availableSchemas, ZodType> = {
  metaphors: Metaphors,
  storyBlueprint: StoryBlueprint,
  recommendedTask: RecommendedTask,
  quest: Quest,
}

export function getSchema(id: availableSchemas): ZodType {
  return schemaMap[id];
}
