import type { createServerSupabaseClient } from '#/lib/supabase-server'
import { DEFAULT__MODEL_TEXT } from '#/modules/ai/constants'
import {
  isUserLanguage,
  isUserTextModel,
  resolveUserLanguage,
  resolveSoundsEnabled,
  resolveUserTextModel,
  type UserLanguage,
  type UserSettingsResponse,
  type UserTextModel,
} from '#/modules/user-settings'

type ServerSupabase = ReturnType<typeof createServerSupabaseClient>

export class UserSettingsError extends Error {
  constructor(
    message: string,
    public status = 500,
  ) {
    super(message)
  }
}

export async function getUserSettings({
  supabase,
  userId,
}: {
  supabase: ServerSupabase
  userId: string
}): Promise<UserSettingsResponse> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('text_model, sounds_enabled, language')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new UserSettingsError(error.message)
  }

  return {
    language: resolveUserLanguage(data?.language),
    soundsEnabled: resolveSoundsEnabled(data?.sounds_enabled),
    textModel: resolveUserTextModel(data?.text_model ?? DEFAULT__MODEL_TEXT),
  }
}

export async function getResolvedUserTextGenerationSettings({
  supabase,
  userId,
}: {
  supabase: ServerSupabase
  userId: string
}): Promise<{ language: UserLanguage; textModel: UserTextModel }> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('text_model, language')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new UserSettingsError(error.message)
  }

  return {
    language: resolveUserLanguage(data?.language),
    textModel: resolveUserTextModel(data?.text_model ?? DEFAULT__MODEL_TEXT),
  }
}

export async function updateUserSettings({
  language,
  soundsEnabled,
  supabase,
  textModel,
  userId,
}: {
  language?: UserLanguage | null
  soundsEnabled?: boolean
  supabase: ServerSupabase
  textModel?: UserTextModel | null
  userId: string
}): Promise<UserSettingsResponse> {
  if (textModel !== undefined && textModel !== null && !isUserTextModel(textModel)) {
    throw new UserSettingsError('Valid text model is required.', 400)
  }

  if (language !== undefined && language !== null && !isUserLanguage(language)) {
    throw new UserSettingsError('Valid language is required.', 400)
  }

  const values = {
    ...(language !== undefined ? { language: resolveUserLanguage(language) } : {}),
    ...(soundsEnabled !== undefined ? { sounds_enabled: soundsEnabled } : {}),
    ...(textModel !== undefined ? { text_model: textModel } : {}),
    user_id: userId,
  }

  const { data, error } = await supabase
    .from('user_settings')
    .upsert(values, { onConflict: 'user_id' })
    .select('text_model, sounds_enabled, language')
    .single()

  if (error) {
    throw new UserSettingsError(error.message)
  }

  return {
    language: resolveUserLanguage(data.language),
    soundsEnabled: resolveSoundsEnabled(data.sounds_enabled),
    textModel: resolveUserTextModel(data.text_model ?? DEFAULT__MODEL_TEXT),
  }
}
