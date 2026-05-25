import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Switch } from '#/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '#/components/ui/tooltip'
import {
  useUpdateUserSettingsMutation,
  useUserSettingsQuery,
} from '#/modules/story-flow/story-api-client'
import {
  DEFAULT_USER_TEXT_MODEL,
  DEFAULT_SOUNDS_ENABLED,
  isUserTextModel,
  USER_TEXT_MODEL_OPTIONS,
} from '#/modules/user-settings'
import { useAuthStore } from '#/state/auth'
import { Brain, Circle, Loader2, Settings, Volume2, Zap } from 'lucide-react'

const MODEL_ICONS = {
  'gemini-3.1-flash-lite': Zap,
  'gemini-3.1-pro-preview': Brain,
  'gemini-3-flash-preview': Circle,
} as const

export function SettingsDialog() {
  const user = useAuthStore((state) => state.user)
  const authIsLoading = useAuthStore((state) => state.isLoading)
  const settingsQuery = useUserSettingsQuery({ enabled: Boolean(user) })
  const updateSettings = useUpdateUserSettingsMutation()
  const selectedModel = settingsQuery.data?.textModel ?? DEFAULT_USER_TEXT_MODEL
  const soundsEnabled = settingsQuery.data?.soundsEnabled ?? DEFAULT_SOUNDS_ENABLED
  const disabled = authIsLoading || !user
  const isBusy = settingsQuery.isPending || updateSettings.isPending

  function updateModel(value: string) {
    if (!isUserTextModel(value) || value === selectedModel) {
      return
    }

    updateSettings.mutate({ textModel: value })
  }

  function updateSoundsEnabled(checked: boolean) {
    if (checked === soundsEnabled) {
      return
    }

    updateSettings.mutate({ soundsEnabled: checked })
  }

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              aria-label="Settings"
              disabled={disabled}
              size="icon-sm"
              variant="outline"
            >
              {isBusy ? <Loader2 className="animate-spin" /> : <Settings />}
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Settings</p>
        </TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Choose how the narrator writes and sounds.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="text-model">Model</Label>
            <Select
              disabled={isBusy}
              onValueChange={updateModel}
              value={selectedModel}
            >
              <SelectTrigger className="w-full" id="text-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="w-[min(var(--radix-select-trigger-width),calc(100vw-2rem))]">
                {USER_TEXT_MODEL_OPTIONS.map((option) => {
                  const Icon = MODEL_ICONS[option.value]

                  return (
                    <SelectItem
                      className="items-start"
                      key={option.value}
                      textValue={`${option.label} ${option.description}`}
                      value={option.value}
                    >
                      <Icon className="size-4" />
                      <div className="min-w-0 flex-1">
                        <span className="block font-medium leading-tight">{option.label}</span>
                        <span className="block truncate text-xs leading-tight text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/45 p-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                <Volume2 className="size-4" />
              </div>
              <div className="min-w-0">
                <Label htmlFor="sounds-enabled">Sounds</Label>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Button taps and story moments.
                </p>
              </div>
            </div>
            <Switch
              checked={soundsEnabled}
              disabled={isBusy}
              id="sounds-enabled"
              onCheckedChange={updateSoundsEnabled}
            />
          </div>

          {updateSettings.isError && (
            <p className="text-sm leading-relaxed text-destructive">
              Settings could not be saved.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
