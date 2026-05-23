import type { createServerSupabaseClient } from '#/lib/supabase-server'
import { DEFAULT__MODEL_TEXT } from '#/modules/ai/constants'
import {
  isUserTextModel,
  resolveSoundsEnabled,
  resolveUserTextModel,
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
    .select('text_model, sounds_enabled')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new UserSettingsError(error.message)
  }

  return {
    soundsEnabled: resolveSoundsEnabled(data?.sounds_enabled),
    textModel: resolveUserTextModel(data?.text_model ?? DEFAULT__MODEL_TEXT),
  }
}

export async function getResolvedUserTextModel({
  supabase,
  userId,
}: {
  supabase: ServerSupabase
  userId: string
}): Promise<UserTextModel> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('text_model')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new UserSettingsError(error.message)
  }

  return resolveUserTextModel(data?.text_model ?? DEFAULT__MODEL_TEXT)
}

export async function updateUserSettings({
  soundsEnabled,
  supabase,
  textModel,
  userId,
}: {
  soundsEnabled?: boolean
  supabase: ServerSupabase
  textModel?: UserTextModel | null
  userId: string
}): Promise<UserSettingsResponse> {
  if (textModel !== undefined && textModel !== null && !isUserTextModel(textModel)) {
    throw new UserSettingsError('Valid text model is required.', 400)
  }

  const values = {
    ...(soundsEnabled !== undefined ? { sounds_enabled: soundsEnabled } : {}),
    ...(textModel !== undefined ? { text_model: textModel } : {}),
    user_id: userId,
  }

  const { data, error } = await supabase
    .from('user_settings')
    .upsert(values, { onConflict: 'user_id' })
    .select('text_model, sounds_enabled')
    .single()

  if (error) {
    throw new UserSettingsError(error.message)
  }

  return {
    soundsEnabled: resolveSoundsEnabled(data.sounds_enabled),
    textModel: resolveUserTextModel(data.text_model ?? DEFAULT__MODEL_TEXT),
  }
}
