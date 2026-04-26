import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { ZodType } from 'zod'

function isTruthy(value: string | undefined) {
  return value === '1' || value === 'true' || value === 'yes'
}

export function isMockMode() {
  return isTruthy(process.env.IS_MOCK_MODE) || isTruthy(process.env.MOCK_MODE)
}

export async function readMockData<T extends ZodType>(schema: T) {
  const mockPath = join(process.cwd(), 'mocks', 'json.json')
  const content = await readFile(mockPath, 'utf8')
  return schema.parse(JSON.parse(content))
}

export async function readMockImage() {
  const mockPath = join(process.cwd(), 'mocks', 'image.txt')
  return (await readFile(mockPath, 'utf8')).trim()
}
