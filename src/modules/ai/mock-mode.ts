import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { ZodType } from 'zod'

function getMockLabels() {
  const value = process.env.MOCK

  if (!value) {
    return new Set<string>()
  }

  return new Set(
    value
      .split(',')
      .map((label) => label.trim())
      .filter(Boolean)
  )
}

export function shouldMock(label: string) {
  const labels = getMockLabels()
  return labels.has('all') || labels.has(label)
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function readMockData<T extends ZodType>(schema: T, schemaId: string) {
  const mockPath = join(process.cwd(), 'mocks', `${schemaId}.json`)
  await delay(4800)
  const content = await readFile(mockPath, 'utf8')
  return schema.parse(JSON.parse(content))
}

export async function readMockImage() {
  await delay(1370)
  const mockPath = join(process.cwd(), 'mocks', 'image.txt')
  return (await readFile(mockPath, 'utf8')).trim()
}
