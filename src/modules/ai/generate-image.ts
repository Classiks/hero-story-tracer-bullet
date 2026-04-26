import { generateImage as generateImageTanstack, type GeneratedImage } from '@tanstack/ai'
import { geminiImage } from '@tanstack/ai-gemini'
import { DEFAULT__MODEL_IMAGE } from './constants'

export async function generateImage(prompt: string): Promise<GeneratedImage> {
  const result = await generateImageTanstack({
    adapter: geminiImage(DEFAULT__MODEL_IMAGE),
    prompt: prompt,
    size: "16:9_1K"
  });
  return result.images[0];
}
