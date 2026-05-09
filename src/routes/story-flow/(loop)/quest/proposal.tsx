import { Button } from '#/components/ui/button'
import {
  StoryCopy,
  StoryFrame,
  StoryHeading,
  StoryKicker,
  StorySurface,
} from '#/components/story-flow/story-primitives'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '#/components/ui/tooltip'
import {
  type IQuestProposal,
} from '#/modules/ai/schemas/metaphors'
import { useStoryBlueprintQuery } from '#/modules/story-flow/onboarding'
import { useOnboardingStore } from '#/state/onboarding'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Check,
  CircleQuestionMark,
  RefreshCw,
  ScrollText,
  Sparkles,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Route as StartRoute } from '#/routes/story-flow/(onboarding)/name'
import { Route as NextRoute } from '#/routes/story-flow/(loop)/quest/feedback'
import { useQuestProposalQuery } from '#/modules/story-flow/quest'

export const Route = createFileRoute('/story-flow/(loop)/quest/proposal')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const rawName = useOnboardingStore((state) => state.name)
  const rawGoal = useOnboardingStore((state) => state.goal)
  const rawChallenge = useOnboardingStore((state) => state.mainProblem)

  const name = rawName.trim()
  const goal = rawGoal.trim()
  const challenge = rawChallenge.trim()
  const hasInputs = Boolean(name && goal && challenge)

  const storyQuery = useStoryBlueprintQuery({ challenge, enabled: hasInputs, goal, name })
  const proposalQuery = useQuestProposalQuery({
    challenge,
    enabled: hasInputs && Boolean(storyQuery.data),
    goal,
    name,
    storyBlueprint: storyQuery.data,
  })

  if (!hasInputs) {
    return (
      <StoryFrame>
        <div className="flex min-h-svh flex-col justify-between px-5 py-6">
          <div>
            <StoryKicker>Chronicle paused</StoryKicker>
            <StoryHeading accent="quest.">Missing</StoryHeading>
            <StoryCopy>
              The story needs a hero, a quest, and a challenge before it can
              shape the next step.
            </StoryCopy>
          </div>

          <Button
            onClick={() => navigate({ to: StartRoute.to })}
            size="hero"
            variant="hero"
          >
            <ArrowLeft />
            Start onboarding
          </Button>
        </div>
      </StoryFrame>
    )
  }

  const isLoading = storyQuery.isPending || proposalQuery.isPending
  const isRegeneratingProposal = proposalQuery.isRefetching
  const hasError = storyQuery.isError || proposalQuery.isError
  const proposal = proposalQuery.data

  return (
    <StoryFrame>
      <main className="min-h-svh px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36 }}
        >
          <StoryKicker>Active quest</StoryKicker>

          {isLoading && <QuestLoading name={name} />}

          {hasError && (
            <QuestErrorState
              onRetry={() => void refetchFailedQueries({ proposalQuery, storyQuery })}
            />
          )}

          {proposal && (
            <QuestPresentation
              isRegeneratingProposal={isRegeneratingProposal}
              onRegenerateProposal={() => void proposalQuery.refetch()}
              proposal={proposal}
            />
          )}
        </motion.div>
      </main>
    </StoryFrame>
  )
}

function QuestLoading({ name }: { name: string }) {
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
        The narrator is reading the path ahead for {name} and shaping one step
        into a quest worth answering.
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
  isRegeneratingProposal,
  onRegenerateProposal,
  proposal,
}: {
  isRegeneratingProposal: boolean
  onRegenerateProposal: () => void
  proposal: IQuestProposal
}) {
  const navigate = useNavigate()
  const { quest, recommendedTask } = proposal

  function handleAcceptQuest() {
    void new Audio('/assets/sounds/quest-accepted.mp3').play().catch(() => undefined)
    navigate({ to: NextRoute.to });
  }

  return (
    <div className="mt-10 pb-5">
      <StoryHeading
        className="mt-7"
        compact
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {quest.quest}
      </StoryHeading>

      <StorySurface
        className="mt-6 p-5"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
      >
        <p className="text-base leading-relaxed text-foreground/85">{quest.content}</p>
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
          {quest.action}
        </p>
      </StorySurface>

      <div className="mt-6 flex items-center gap-3">
        <Button className="flex-1" onClick={handleAcceptQuest} size="hero" variant="hero">
          <Check />
          Accept
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Generate a new quest"
              disabled={isRegeneratingProposal}
              onClick={onRegenerateProposal}
              size="hero-icon"
              variant="outline"
            >
              <RefreshCw className={isRegeneratingProposal ? 'animate-spin' : undefined} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Generate a new quest</p>
          </TooltipContent>
        </Tooltip>

        <QuestReasonDialog
          quest={quest}
          task={recommendedTask}
        />
      </div>
    </div>
  )
}

function QuestReasonDialog({
  quest,
  task,
}: {
  quest: IQuestProposal['quest']
  task: IQuestProposal['recommendedTask']
}) {
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
            <p className="mt-2 leading-relaxed text-muted-foreground">{task?.task}</p>
          </section>

          <section className="rounded-2xl border border-border bg-card/60 p-4">
            <h3 className="font-semibold text-foreground">Why</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">{task?.reasoning}</p>
          </section>

          <section className="rounded-2xl border border-border bg-card/60 p-4">
            <h3 className="font-semibold text-foreground">What is being translated</h3>
            <div className="mt-3 space-y-3">
              {quest.metaphors.map((metaphor) => (
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

async function refetchFailedQueries({
  proposalQuery,
  storyQuery,
}: {
  proposalQuery: ReturnType<typeof useQuestProposalQuery>
  storyQuery: ReturnType<typeof useStoryBlueprintQuery>
}) {
  if (storyQuery.isError) {
    await storyQuery.refetch()
    return
  }

  await proposalQuery.refetch()
}
