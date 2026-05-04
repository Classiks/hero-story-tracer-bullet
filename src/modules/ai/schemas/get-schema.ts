import { ZodType } from "zod";
import { Metaphors, Quest, QuestResultText, RecommendedTask, StoryBlueprint } from "./metaphors";

type availableSchemas = "metaphors" | "storyBlueprint" | "recommendedTask" | "quest" | "questResultText"
const schemaMap: Record<availableSchemas, ZodType> = {
  metaphors: Metaphors,
  storyBlueprint: StoryBlueprint,
  recommendedTask: RecommendedTask,
  quest: Quest,
  questResultText: QuestResultText,
}

export function getSchema(id: availableSchemas): ZodType {
  return schemaMap[id];
}
