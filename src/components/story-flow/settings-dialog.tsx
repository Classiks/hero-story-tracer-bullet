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
import { Tooltip, TooltipContent, TooltipTrigger } from '#/components/ui/tooltip'
import {
  useUpdateUserSettingsMutation,
  useUserSettingsQuery,
} from '#/modules/story-flow/story-api-client'
import {
  DEFAULT_USER_TEXT_MODEL,
  isUserTextModel,
  USER_TEXT_MODEL_OPTIONS,
} from '#/modules/user-settings'
import { useAuthStore } from '#/state/auth'
import { Loader2, Settings } from 'lucide-react'

export function SettingsDialog() {
  const user = useAuthStore((state) => state.user)
  const authIsLoading = useAuthStore((state) => state.isLoading)
  const settingsQuery = useUserSettingsQuery({ enabled: Boolean(user) })
  const updateSettings = useUpdateUserSettingsMutation()
  const selectedModel = settingsQuery.data?.textModel ?? DEFAULT_USER_TEXT_MODEL
  const disabled = authIsLoading || !user
  const isBusy = settingsQuery.isPending || updateSettings.isPending

  function updateModel(value: string) {
    if (!isUserTextModel(value) || value === selectedModel) {
      return
    }

    updateSettings.mutate({ textModel: value })
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
          <DialogDescription>Choose how the narrator writes future story text.</DialogDescription>
        </DialogHeader>

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
            <SelectContent>
              {USER_TEXT_MODEL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
