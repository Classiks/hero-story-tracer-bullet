import { setSoundEffectsEnabled } from '#/lib/sound-effects'
import { useUserSettingsQuery } from '#/modules/story-flow/story-api-client'
import { DEFAULT_SOUNDS_ENABLED } from '#/modules/user-settings'
import { useAuthStore } from '#/state/auth'
import { useEffect } from 'react'

export function SoundSettingsSync() {
  const user = useAuthStore((state) => state.user)
  const settingsQuery = useUserSettingsQuery({ enabled: Boolean(user) })
  const soundsEnabled = settingsQuery.data?.soundsEnabled ?? DEFAULT_SOUNDS_ENABLED

  useEffect(() => {
    setSoundEffectsEnabled(user ? soundsEnabled : DEFAULT_SOUNDS_ENABLED)
  }, [soundsEnabled, user])

  return null
}
