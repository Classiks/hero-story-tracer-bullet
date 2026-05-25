export const USER_TEXT_MODEL_OPTIONS = [
  {
    description: 'Deepest reasoning, slowest pace',
    label: 'Pro',
    value: 'gemini-3.1-pro-preview',
  },
  {
    description: 'Strong balance of speed and quality',
    label: 'Flash',
    value: 'gemini-3-flash-preview',
  },
  {
    description: 'Fastest, lightest everyday mode',
    label: 'Flash Lite',
    value: 'gemini-3.1-flash-lite',
  },
] as const

export type UserTextModel = (typeof USER_TEXT_MODEL_OPTIONS)[number]['value']

export const DEFAULT_USER_TEXT_MODEL: UserTextModel = 'gemini-3.1-flash-lite'
export const DEFAULT_SOUNDS_ENABLED = true

const USER_TEXT_MODELS = new Set<string>(
  USER_TEXT_MODEL_OPTIONS.map((option) => option.value),
)

export type UserSettingsResponse = {
  soundsEnabled: boolean
  textModel: UserTextModel
}

export type UpdateUserSettingsRequest = {
  soundsEnabled?: boolean
  textModel?: UserTextModel | null
}

export function isUserTextModel(value: unknown): value is UserTextModel {
  return typeof value === 'string' && USER_TEXT_MODELS.has(value)
}

export function resolveUserTextModel(value: unknown): UserTextModel {
  return isUserTextModel(value) ? value : DEFAULT_USER_TEXT_MODEL
}

export function resolveSoundsEnabled(value: unknown) {
  return typeof value === 'boolean' ? value : DEFAULT_SOUNDS_ENABLED
}
