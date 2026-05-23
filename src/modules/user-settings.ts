export const USER_TEXT_MODEL_OPTIONS = [
  {
    description: 'longer, better results',
    label: 'Pro',
    value: 'gemini-3.1-pro-preview',
  },
  {
    description: 'balanced',
    label: 'Flash',
    value: 'gemini-3-flash-preview',
  },
  {
    description: 'fast, worse results',
    label: 'Flash-lite',
    value: 'gemini-3.1-flash-lite-preview',
  },
] as const

export type UserTextModel = (typeof USER_TEXT_MODEL_OPTIONS)[number]['value']

export const DEFAULT_USER_TEXT_MODEL: UserTextModel = 'gemini-3.1-flash-lite-preview'

const USER_TEXT_MODELS = new Set<string>(
  USER_TEXT_MODEL_OPTIONS.map((option) => option.value),
)

export type UserSettingsResponse = {
  textModel: UserTextModel
}

export type UpdateUserSettingsRequest = {
  textModel?: UserTextModel | null
}

export function isUserTextModel(value: unknown): value is UserTextModel {
  return typeof value === 'string' && USER_TEXT_MODELS.has(value)
}

export function resolveUserTextModel(value: unknown): UserTextModel {
  return isUserTextModel(value) ? value : DEFAULT_USER_TEXT_MODEL
}
