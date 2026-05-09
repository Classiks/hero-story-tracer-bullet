import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import {
  StoryCopy,
  StoryFrame,
  StoryHeading,
  StoryKicker,
  StorySurface,
} from '#/components/story-flow/story-primitives'
import { Tooltip, TooltipContent, TooltipTrigger } from '#/components/ui/tooltip'
import type { PersistedQuest } from '#/modules/story-flow/persisted-types'
import {
  useAcceptQuestMutation,
  useCreateQuestMutation,
  useStorySessionQuery,
} from '#/modules/story-flow/story-api-client'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Check,
  CircleQuestionMark,
  Loader2,
  RefreshCw,
  ScrollText,
  Sparkles,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Route as StartRoute } from '#/routes/story-flow/(onboarding)/name'
import { Route as FeedbackRoute } from '#/routes/story-flow/(persisted)/stories/$storyId/quest/$questId/feedback'

export const Route = createFileRoute('/story-flow/(persisted)/stories/$storyId/quest/proposal')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { storyId } = Route.useParams()
  const sessionQuery = useStorySessionQuery(storyId)
  const createQuest = useCreateQuestMutation()
  const requested = useRef(false)
  const latestQuest = sessionQuery.data?.latestQuest
  const shouldCreateQuest =
    sessionQuery.isSuccess &&
    (!latestQuest || ['completed', 'unresolved', 'rejected'].includes(latestQuest.status))
  const visibleQuest = createQuest.data?.quest ?? latestQuest

  useEffect(() => {
    if (!shouldCreateQuest || requested.current) {
      return
    }

    requested.current = true
    createQuest.mutate(storyId, {
      onError: () => {
        requested.current = false
      },
    })
  }, [createQuest, shouldCreateQuest, storyId])

  const isLoading = sessionQuery.isPending || (shouldCreateQuest && createQuest.isPending)
  const hasError = sessionQuery.isError || createQuest.isError

  return (
    <StoryFrame>
      <main className="min-h-svh px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36 }}
        >
          <StoryKicker>Active quest</StoryKicker>

          {isLoading && <QuestLoading name={sessionQuery.data?.story.name} />}

          {hasError && (
            <QuestErrorState
              onRetry={() => {
                requested.current = false
                if (sessionQuery.isError) {
                  void sessionQuery.refetch()
                  return
                }
                createQuest.mutate(storyId)
              }}
            />
          )}

          {visibleQuest && (
            <QuestPresentation
              isCreatingQuest={createQuest.isPending}
              onRegenerateQuest={() => {
                requested.current = true
                createQuest.mutate(storyId)
              }}
              quest={visibleQuest}
            />
          )}
        </motion.div>
      </main>
    </StoryFrame>
  )
}

function QuestLoading({ name }: { name: string | undefined }) {
  return (
    <div className="mt-12">
      <motion.div
        aria-hidden="true"
        className="mx-auto grid size-28 place-items-center rounded-full border border-accent/20 bg-accent/10 text-accent"
        animate={{ rotate: 360, scale: [1, 1.04, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      >
        <ScrollText className="size-9" />
      </motion.div>
      <StoryHeading accent="quest." compact>
        Preparing
      </StoryHeading>
      <StoryCopy wide>
        The narrator is reading the path ahead{name ? ` for ${name}` : ''} and
        shaping one step into a quest worth answering.
      </StoryCopy>
    </div>
  )
}

function QuestErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <StorySurface className="mt-12 p-5">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
          <Sparkles className="size-5" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">The quest failed to form.</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Step back into the story and ask the narrator to try again.
          </p>
        </div>
      </div>

      <Button className="mt-5 w-full" onClick={onRetry} size="hero" variant="hero">
        Try again
      </Button>
    </StorySurface>
  )
}

function QuestPresentation({
  isCreatingQuest,
  onRegenerateQuest,
  quest,
}: {
  isCreatingQuest: boolean
  onRegenerateQuest: () => void
  quest: PersistedQuest
}) {
  const navigate = useNavigate()
  const acceptQuest = useAcceptQuestMutation()

  function handleAcceptQuest() {
    acceptQuest.mutate(quest.id, {
      onSuccess: ({ quest: acceptedQuest }) => {
        void new Audio('/assets/sounds/quest-accepted.mp3').play().catch(() => undefined)
        void navigate({
          params: { questId: acceptedQuest.id, storyId: acceptedQuest.storyId },
          to: FeedbackRoute.to,
        })
      },
    })
  }

  return (
    <div className="mt-10 pb-5">
      <StoryHeading
        className="mt-7"
        compact
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {quest.quest.quest}
      </StoryHeading>

      <StorySurface
        className="mt-6 p-5"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
      >
        <p className="text-base leading-relaxed text-foreground/85">{quest.quest.content}</p>
      </StorySurface>

      <StorySurface
        className="mt-4 border-accent/25 bg-accent/10 p-5"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Action
        </p>
        <p className="mt-3 text-lg font-semibold leading-snug text-foreground">
          {quest.quest.action}
        </p>
      </StorySurface>

      <div className="mt-6 flex items-center gap-3">
        <Button
          className="flex-1"
          disabled={acceptQuest.isPending}
          onClick={handleAcceptQuest}
          size="hero"
          variant="hero"
        >
          {acceptQuest.isPending ? <Loader2 className="animate-spin" /> : <Check />}
          Accept
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Generate a new quest"
              disabled={isCreatingQuest}
              onClick={onRegenerateQuest}
              size="hero-icon"
              variant="outline"
            >
              <RefreshCw className={isCreatingQuest ? 'animate-spin' : undefined} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Generate a new quest</p>
          </TooltipContent>
        </Tooltip>

        <QuestReasonDialog quest={quest} />
      </div>
    </div>
  )
}

function QuestReasonDialog({ quest }: { quest: PersistedQuest }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button aria-label="Why this quest" size="hero-icon" variant="outline">
              <CircleQuestionMark />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Why this quest</p>
        </TooltipContent>
      </Tooltip>
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
            <p className="mt-2 leading-relaxed text-muted-foreground">{quest.recommendedTask.task}</p>
          </section>

          <section className="rounded-2xl border border-border bg-card/60 p-4">
            <h3 className="font-semibold text-foreground">Why</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">{quest.recommendedTask.reasoning}</p>
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
