import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { StorySurface } from '#/components/story-flow/story-primitives'
import { Tooltip, TooltipContent, TooltipTrigger } from '#/components/ui/tooltip'
import type { PersistedQuest } from '#/modules/story-flow/persisted-types'
import { CircleQuestionMark, ClipboardCheck } from 'lucide-react'
import { useState, type ReactNode } from 'react'

export function QuestRealityTaskCard({ quest }: { quest: PersistedQuest }) {
  return (
    <StorySurface className="mt-5 border-accent/25 bg-accent/10 p-5">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
          <ClipboardCheck className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Real-world step
          </p>
          <p className="mt-2 text-base font-semibold leading-snug text-foreground">
            {quest.recommendedTask.task}
          </p>
          <QuestReasonDialog
            quest={quest}
            trigger={
              <Button className="mt-3 px-0" size="sm" type="button" variant="link">
                Why this quest
              </Button>
            }
          />
        </div>
      </div>
    </StorySurface>
  )
}

export function QuestReasonDialog({
  quest,
  tooltipLabel,
  trigger,
}: {
  quest: PersistedQuest
  tooltipLabel?: string
  trigger?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const triggerElement = trigger ?? (
    <Button aria-label="Why this quest" size="hero-icon" type="button" variant="outline">
      <CircleQuestionMark />
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {tooltipLabel ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>{triggerElement}</DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipLabel}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <DialogTrigger asChild>{triggerElement}</DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Why this quest</DialogTitle>
          <DialogDescription>
            The hidden recommendation and story translation behind this quest.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <section className="rounded-2xl border border-border bg-card/60 p-4">
            <h3 className="font-semibold text-foreground">Recommended step</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              {quest.recommendedTask.task}
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card/60 p-4">
            <h3 className="font-semibold text-foreground">Why</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              {quest.recommendedTask.reasoning}
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card/60 p-4">
            <h3 className="font-semibold text-foreground">What is being translated</h3>
            <div className="mt-3 space-y-3">
              {quest.quest.metaphors.map((metaphor) => (
                <div key={`${metaphor.real}:${metaphor.metaphor}`} className="space-y-1">
                  <p className="font-medium leading-snug text-foreground">{metaphor.real}</p>
                  <p className="leading-relaxed text-muted-foreground">{metaphor.metaphor}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
