import { Button } from '#/components/ui/button'
import { InputDepthMeter } from '#/components/story-flow/input-depth-meter'
import { QuestRealityTaskCard } from '#/components/story-flow/quest-context'
import {
  StoryCopy,
  StoryFrame,
  StoryHeading,
  StorySurface,
} from '#/components/story-flow/story-primitives'
import { StoryRouteHeader } from '#/components/story-flow/story-route-header'
import { Textarea } from '#/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '#/components/ui/tooltip'
import {
  useCompleteQuestMutation,
  useQuestQuery,
} from '#/modules/story-flow/story-api-client'
import type { QuestOutcomeStatus } from '#/modules/story-flow/quest-outcome'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Check,
  CircleQuestionMark,
  CircleSlash,
  Loader2,
  NotebookPen,
  ScrollText,
  Sparkles,
  Swords,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Route as LandingRoute } from '#/routes/story-flow/index'
import { Route as ResultRoute } from '#/routes/story-flow/(persisted)/stories/$storyId/quest/$questId/result'

export const Route = createFileRoute('/story-flow/(persisted)/stories/$storyId/quest/$questId/feedback')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { questId, storyId } = Route.useParams()
  const questQuery = useQuestQuery(questId)
  const completeQuest = useCompleteQuestMutation()
  const [note, setNote] = useState('')
  const quest = questQuery.data?.quest
  const trimmedNote = note.trim()

  function complete(outcomeStatus: QuestOutcomeStatus) {
    completeQuest.mutate(
      {
        feedback: trimmedNote ? { note: trimmedNote } : {},
        outcomeStatus,
        questId,
      },
      {
        onSuccess: () => {
          void navigate({
            params: { questId, storyId },
            to: ResultRoute.to,
          })
        },
      },
    )
  }

  return (
    <StoryFrame>
      <main className="min-h-svh px-5 py-6">
        <StoryRouteHeader>Quest feedback</StoryRouteHeader>

        {questQuery.isPending && <QuestFeedbackLoading />}

        {questQuery.isError && (
          <StorySurface className="mt-12 p-5">
            <h1 className="font-semibold text-foreground">The quest could not be loaded.</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Go back to the story and try again.
            </p>
            <Button
              className="mt-5 w-full"
              onClick={() => navigate({ to: LandingRoute.to })}
              size="hero"
              variant="hero"
            >
              <ArrowLeft />
              Back to stories
            </Button>
          </StorySurface>
        )}

        {quest && (
          <div className="mt-10 pb-5">
            <StoryHeading compact size="page">Quest wrap-up</StoryHeading>
            <StoryCopy className="max-w-none text-foreground/80">
              Mark the outcome. The narrator will turn it into the next story beat.
            </StoryCopy>

            <StorySurface className="mt-6 p-4">
              <div className="grid gap-3">
                <QuestSummaryItem
                  icon={<ScrollText className="size-5" />}
                  label="Quest"
                  value={quest.quest.quest}
                />
                <QuestSummaryItem
                  accent
                  icon={<Swords className="size-5" />}
                  label="Action"
                  value={quest.quest.action}
                />
              </div>
            </StorySurface>

            <QuestRealityTaskCard quest={quest} />

            <StorySurface className="mt-5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <NotebookPen className="size-5" />
                  </div>
                  <h2 className="font-semibold leading-tight text-foreground">
                    Note <span className="text-muted-foreground">(optional)</span>
                  </h2>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button aria-label="What should I write in the note?" size="icon" variant="ghost" sound={false}>
                      <CircleQuestionMark className="size-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-64">
                    <p>
                      Add what worked, what failed, what got in the way, or what
                      changed. Leave this blank if the outcome says enough.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Textarea
                className="mt-4 min-h-32"
                onChange={(event) => setNote(event.target.value)}
                placeholder="I started, but got interrupted after ten minutes. The first step was clearer than expected."
                value={note}
              />
              <InputDepthMeter
                options={{
                  targetLength: 100,
                  minHelpfulLength: 35,
                  label: 'Useful note',
                  completeLabel: 'Rich note',
                }}
                value={note}
              />
            </StorySurface>

            {completeQuest.isError && (
              <div className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-foreground">
                The result could not be written. Try marking the quest again.
              </div>
            )}

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Mark quest
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Button
                disabled={completeQuest.isPending}
                onClick={() => complete('completed')}
                size="hero"
                variant="hero"
              >
                {completeQuest.isPending ? <Loader2 className="animate-spin" /> : <Check />}
                Complete
              </Button>
              <Button
                disabled={completeQuest.isPending}
                onClick={() => complete('unresolved')}
                size="hero"
                variant="outline"
              >
                <CircleSlash />
                Unresolved
              </Button>
            </div>
          </div>
        )}
      </main>
    </StoryFrame>
  )
}

function QuestSummaryItem({
  accent = false,
  icon,
  label,
  value,
}: {
  accent?: boolean
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/35 p-3">
      <div
        className={
          accent
            ? 'grid size-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent'
            : 'grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary'
        }
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p
          className={
            accent
              ? 'text-xs font-semibold uppercase tracking-widest text-accent'
              : 'text-xs font-semibold uppercase tracking-widest text-muted-foreground'
          }
        >
          {label}
        </p>
        <p className="mt-1 text-sm font-semibold leading-snug text-foreground">{value}</p>
      </div>
    </div>
  )
}

function QuestFeedbackLoading() {
  return (
    <div className="mt-12">
      <motion.div
        aria-hidden="true"
        className="mx-auto grid size-28 place-items-center rounded-full border border-accent/20 bg-accent/10 text-accent shadow-[0_0_42px_color-mix(in_srgb,var(--accent)_22%,transparent)]"
        animate={{ rotate: 360, scale: [1, 1.04, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      >
        <ScrollText className="size-9" />
      </motion.div>
      <motion.div
        className="mt-7 flex justify-center"
        animate={{ opacity: [0.45, 1, 0.45] }}
        transition={{ duration: 1.7, repeat: Infinity }}
      >
        <Sparkles className="size-5 text-primary" />
      </motion.div>
      <StoryHeading accent="quest." compact size="page">
        Reading
      </StoryHeading>
      <StoryCopy wide>
        The narrator is finding the accepted quest before recording the outcome.
      </StoryCopy>
    </div>
  )
}
