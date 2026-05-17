import { Button } from '#/components/ui/button'
import { playSoundEffect } from '#/lib/sound-effects'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { QuestReasonDialog } from '#/components/story-flow/quest-context'
import { InputDepthMeter } from '#/components/story-flow/input-depth-meter'
import {
  StoryCopy,
  StoryFrame,
  StoryHeading,
  StorySurface,
} from '#/components/story-flow/story-primitives'
import { StoryRouteHeader } from '#/components/story-flow/story-route-header'
import { Textarea } from '#/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '#/components/ui/tooltip'
import type { PersistedQuest } from '#/modules/story-flow/persisted-types'
import {
  useAcceptQuestMutation,
  useCreateQuestMutation,
  useRejectQuestMutation,
  useStorySessionQuery,
} from '#/modules/story-flow/story-api-client'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  RefreshCw,
  ScrollText,
  Sparkles,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Route as LandingRoute } from '#/routes/story-flow/index'
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
  const [suppressedQuestId, setSuppressedQuestId] = useState<string | null>(null)
  const latestQuest = sessionQuery.data?.latestQuest
  const latestQuestIsSuppressed = Boolean(latestQuest && latestQuest.id === suppressedQuestId)
  const latestQuestIsTerminal =
    latestQuest && ['completed', 'unresolved', 'rejected'].includes(latestQuest.status)
  const shouldCreateQuest =
    sessionQuery.isSuccess &&
    (!latestQuest || latestQuestIsTerminal || latestQuestIsSuppressed)
  const createdQuest = createQuest.data?.quest
  const createdQuestIsSuppressed = Boolean(createdQuest && createdQuest.id === suppressedQuestId)
  const visibleQuest =
    createdQuest?.status === 'proposed' && !createdQuestIsSuppressed
      ? createdQuest
      : latestQuest?.status === 'proposed' && !latestQuestIsSuppressed
        ? latestQuest
        : null
  const acceptedQuest =
    createdQuest?.status === 'accepted' && !createdQuestIsSuppressed
      ? createdQuest
      : latestQuest?.status === 'accepted' && !latestQuestIsSuppressed
      ? latestQuest
      : null
  const hasRenderableQuest = Boolean(visibleQuest || acceptedQuest)
  const loadingMode = getQuestLoadingMode({
    latestQuest,
    latestQuestIsSuppressed,
    shouldCreateQuest,
  })

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

  const isCreatingQuest =
    shouldCreateQuest && !hasRenderableQuest && (createQuest.isIdle || createQuest.isPending)
  const hasEmptyCreateResult = shouldCreateQuest && createQuest.isSuccess && !hasRenderableQuest
  const isLoading =
    !hasRenderableQuest && (sessionQuery.isPending || createQuest.isPending || isCreatingQuest)
  const hasError =
    !hasRenderableQuest && (sessionQuery.isError || createQuest.isError || hasEmptyCreateResult)

  return (
    <StoryFrame>
      <main className="min-h-svh px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36 }}
        >
          <StoryRouteHeader>Active quest</StoryRouteHeader>

          {visibleQuest ? (
            <QuestPresentation
              onQuestRejected={() => {
                setSuppressedQuestId(visibleQuest.id)
                requested.current = true
                createQuest.reset()
                createQuest.mutate(storyId, {
                  onError: () => {
                    requested.current = false
                  },
                })
              }}
              quest={visibleQuest}
            />
          ) : acceptedQuest ? (
            <AcceptedQuestState quest={acceptedQuest} />
          ) : hasError ? (
            <QuestErrorState
              onBackToStories={() => navigate({ to: LandingRoute.to })}
              onRetry={() => {
                requested.current = false
                if (sessionQuery.isError) {
                  void sessionQuery.refetch()
                  return
                }
                createQuest.reset()
                createQuest.mutate(storyId)
              }}
            />
          ) : isLoading ? (
            <QuestLoading mode={loadingMode} name={sessionQuery.data?.story.name} />
          ) : null}
        </motion.div>
      </main>
    </StoryFrame>
  )
}

function getQuestLoadingMode({
  latestQuest,
  latestQuestIsSuppressed,
  shouldCreateQuest,
}: {
  latestQuest: PersistedQuest | null | undefined
  latestQuestIsSuppressed: boolean
  shouldCreateQuest: boolean
}) {
  if (latestQuestIsSuppressed) {
    return 'replacement' as const
  }

  if (shouldCreateQuest && latestQuest) {
    return 'next' as const
  }

  return 'first' as const
}

function QuestLoading({
  mode,
  name,
}: {
  mode: 'first' | 'next' | 'replacement'
  name: string | undefined
}) {
  const copy = getQuestLoadingCopy(mode)

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
      <StoryHeading compact size="page">
        {copy.heading}
      </StoryHeading>
      <StoryCopy wide>
        {copy.body(name)}
      </StoryCopy>
    </div>
  )
}

function getQuestLoadingCopy(mode: 'first' | 'next' | 'replacement') {
  switch (mode) {
    case 'first':
      return {
        heading: 'Preparing your first quest',
        body: (name: string | undefined) =>
          `The narrator is reading the path ahead${name ? ` for ${name}` : ''} and shaping one step into a quest worth answering.`,
      }
    case 'next':
      return {
        heading: 'Preparing your next quest',
        body: () =>
          'The narrator is reading what already happened and shaping the next step.',
      }
    case 'replacement':
      return {
        heading: 'Finding a better fit',
        body: () =>
          'The old proposal has been set aside. The narrator is using your feedback to shape another quest.',
      }
  }
}

function AcceptedQuestState({ quest }: { quest: PersistedQuest }) {
  const navigate = useNavigate()

  return (
    <StorySurface className="mt-12 p-5">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
          <ScrollText className="size-5" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">This quest is already active.</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Finish the accepted quest before asking for a new one.
          </p>
        </div>
      </div>

      <Button
        className="mt-5 w-full"
        onClick={() =>
          void navigate({
            params: { questId: quest.id, storyId: quest.storyId },
            to: FeedbackRoute.to,
          })
        }
        size="hero"
        variant="hero"
      >
        Finish quest
        <ArrowRight />
      </Button>
    </StorySurface>
  )
}

function QuestErrorState({
  onBackToStories,
  onRetry,
}: {
  onBackToStories: () => void
  onRetry: () => void
}) {
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

      <div className="mt-5 grid gap-3">
        <Button className="w-full" onClick={onRetry} size="hero" variant="hero">
          Try again
        </Button>
        <Button className="w-full" onClick={onBackToStories} size="hero" variant="outline">
          <ArrowLeft />
          Back to stories
        </Button>
      </div>
    </StorySurface>
  )
}

function QuestPresentation({ onQuestRejected, quest }: {
  onQuestRejected: () => void
  quest: PersistedQuest
}) {
  const navigate = useNavigate()
  const acceptQuest = useAcceptQuestMutation()

  function handleAcceptQuest() {
    acceptQuest.mutate(quest.id, {
      onSuccess: ({ quest: acceptedQuest }) => {
        playSoundEffect('questAccepted')
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
        size="page"
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

        <RejectQuestDialog
          onRejected={onQuestRejected}
          quest={quest}
        />

        <QuestReasonDialog quest={quest} tooltipLabel="Why this quest" />
      </div>
    </div>
  )
}

const REJECTION_REASONS = ['Not relevant', 'Too big', 'Bad timing', 'Unclear', 'Already done']

function RejectQuestDialog({
  onRejected,
  quest,
}: {
  onRejected: () => void
  quest: PersistedQuest
}) {
  const rejectQuest = useRejectQuestMutation()
  const [open, setOpen] = useState(false)
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [note, setNote] = useState('')

  function toggleReason(reason: string) {
    setSelectedReasons((current) =>
      current.includes(reason)
        ? current.filter((item) => item !== reason)
        : [...current, reason],
    )
  }

  function buildFeedbackNote() {
    const trimmedNote = note.trim()
    const reasonText = selectedReasons.length
      ? `Rejected because: ${selectedReasons.join(', ')}.`
      : ''

    return [reasonText, trimmedNote].filter(Boolean).join(' ')
  }

  function reject() {
    rejectQuest.mutate(
      {
        feedback: buildFeedbackNote() ? { note: buildFeedbackNote() } : {},
        questId: quest.id,
      },
      {
        onSuccess: () => {
          setOpen(false)
          setSelectedReasons([])
          setNote('')
          onRejected()
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              aria-label="Try another quest"
              disabled={rejectQuest.isPending}
              size="hero-icon"
              variant="outline"
            >
              {rejectQuest.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <RefreshCw />
              )}
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Try another quest</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Try a different quest?</DialogTitle>
          <DialogDescription>
            Optional feedback helps the narrator avoid another quest with the same problem.
          </DialogDescription>
        </DialogHeader>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Reason
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {REJECTION_REASONS.map((reason) => {
              const selected = selectedReasons.includes(reason)
              return (
                <Button
                  className="rounded-full"
                  key={reason}
                  onClick={() => toggleReason(reason)}
                  size="sm"
                  type="button"
                  variant={selected ? 'hero' : 'outline'}
                >
                  {reason}
                </Button>
              )
            })}
          </div>
        </div>

        <Textarea
          className="min-h-28"
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional detail: too large for today, already done, unclear, not useful right now..."
          value={note}
        />
        <InputDepthMeter
          className="mt-0"
          options={{
            targetLength: 45,
            minHelpfulLength: 25,
            label: 'Useful feedback',
            completeLabel: 'Rich feedback',
          }}
          value={note}
        />

        {rejectQuest.isError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-foreground">
            This quest could not be rejected. Try again.
          </p>
        )}

        <DialogFooter>
          <Button onClick={() => setOpen(false)} type="button" variant="outline">
            Keep quest
          </Button>
          <Button
            disabled={rejectQuest.isPending}
            onClick={reject}
            type="button"
            variant="hero"
          >
            {rejectQuest.isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Try another
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
