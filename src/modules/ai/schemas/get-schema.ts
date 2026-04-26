import { ZodType } from "zod";
import { Metaphors, StoryBlueprint } from "./metaphors";

type availableSchemas = "metaphors" | "storyBlueprint"
const schemaMap: Record<availableSchemas, ZodType> = {
  metaphors: Metaphors,
  storyBlueprint: StoryBlueprint,
}

export function getSchema(id: availableSchemas): ZodType {
  return schemaMap[id];
}
