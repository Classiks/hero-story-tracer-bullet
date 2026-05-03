import { ZodType } from "zod";
import { Metaphors, QuestQuestion, RecommendedTask, StoryBlueprint } from "./metaphors";

type availableSchemas = "metaphors" | "storyBlueprint" | "recommendedTask" | "questQuestion"
const schemaMap: Record<availableSchemas, ZodType> = {
  metaphors: Metaphors,
  storyBlueprint: StoryBlueprint,
  recommendedTask: RecommendedTask,
  questQuestion: QuestQuestion,
}

export function getSchema(id: availableSchemas): ZodType {
  return schemaMap[id];
}
