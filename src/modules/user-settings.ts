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

export const USER_LANGUAGE_OPTIONS = [
  {
    label: 'English',
    promptName: 'English',
    value: 'en',
  },
  {
    label: 'German',
    promptName: 'German',
    value: 'de',
  },
] as const

export type UserLanguage = (typeof USER_LANGUAGE_OPTIONS)[number]['value']

export const DEFAULT_USER_TEXT_MODEL: UserTextModel = 'gemini-3.1-flash-lite'
export const DEFAULT_SOUNDS_ENABLED = true
export const DEFAULT_USER_LANGUAGE: UserLanguage = 'en'

const USER_TEXT_MODELS = new Set<string>(
  USER_TEXT_MODEL_OPTIONS.map((option) => option.value),
)

const USER_LANGUAGES = new Set<string>(
  USER_LANGUAGE_OPTIONS.map((option) => option.value),
)

export type UserSettingsResponse = {
  language: UserLanguage
  soundsEnabled: boolean
  textModel: UserTextModel
}

export type UpdateUserSettingsRequest = {
  language?: UserLanguage | null
  soundsEnabled?: boolean
  textModel?: UserTextModel | null
}

export function isUserTextModel(value: unknown): value is UserTextModel {
  return typeof value === 'string' && USER_TEXT_MODELS.has(value)
}

export function resolveUserTextModel(value: unknown): UserTextModel {
  return isUserTextModel(value) ? value : DEFAULT_USER_TEXT_MODEL
}

export function isUserLanguage(value: unknown): value is UserLanguage {
  return typeof value === 'string' && USER_LANGUAGES.has(value)
}

export function resolveUserLanguage(value: unknown): UserLanguage {
  return isUserLanguage(value) ? value : DEFAULT_USER_LANGUAGE
}

export function getUserLanguagePromptName(language: UserLanguage) {
  return USER_LANGUAGE_OPTIONS.find((option) => option.value === language)?.promptName ?? 'English'
}

export function resolveSoundsEnabled(value: unknown) {
  return typeof value === 'boolean' ? value : DEFAULT_SOUNDS_ENABLED
}
