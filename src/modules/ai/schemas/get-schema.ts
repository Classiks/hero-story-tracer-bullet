import { ZodType } from "zod";
import { Metaphors } from "./metaphors";

type availableSchemas = "metaphors"
const schemaMap: Record<availableSchemas, ZodType> = {
  metaphors: Metaphors
}

export function getSchema(id: availableSchemas): ZodType {
  return schemaMap[id];
}
