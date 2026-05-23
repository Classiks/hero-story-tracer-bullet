import { chat, type ModelMessage } from "@tanstack/ai";
import { geminiText } from "@tanstack/ai-gemini";
import { z } from "zod";
import { DEFAULT__MODEL_TEXT } from "#/modules/ai/constants"
import type { UserTextModel } from "#/modules/user-settings"

type TextMessage = ModelMessage<string>

export async function generateData<T extends z.ZodType>(
  messages: TextMessage[] | string,
  schema: T,
  options: { model?: UserTextModel } = {},
): Promise<z.infer<T>> {
  const resolvedMessages: TextMessage[] = typeof messages === "string"
    ? [{ role: "user", content: messages }]
    : messages;
  const model = options.model ?? DEFAULT__MODEL_TEXT

  return await chat({
    // @ts-ignore: trust me bro
    adapter: geminiText(model),
    messages: resolvedMessages,
    outputSchema: schema
  });
}
