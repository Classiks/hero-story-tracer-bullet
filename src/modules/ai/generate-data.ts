import { chat, type ModelMessage } from "@tanstack/ai";
import { geminiText } from "@tanstack/ai-gemini";
import { z } from "zod";
import { DEFAULT__MODEL_TEXT } from "#/modules/ai/constants"

type TextMessage = ModelMessage<string>

export async function generateData<T extends z.ZodType>(messages: TextMessage[] | string, schema: T): Promise<z.infer<T>> {
  const resolvedMessages: TextMessage[] = typeof messages === "string"
    ? [{ role: "user", content: messages }]
    : messages;

  return await chat({
    adapter: geminiText(DEFAULT__MODEL_TEXT),
    messages: resolvedMessages,
    outputSchema: schema
  });
}

