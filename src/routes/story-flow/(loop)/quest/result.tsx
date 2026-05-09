import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '#/components/ui/accordion'
import { Button } from '#/components/ui/button'
import {
  StoryCopy,
  StoryFrame,
  StoryHeading,
  StoryKicker,
  StorySurface,
} from '#/components/story-flow/story-primitives'
import { useStoryBlueprintQuery } from '#/modules/story-flow/onboarding'
import { useQuestProposalQuery } from '#/modules/story-flow/quest'
import {
  isQuestOutcomeStatus,
  questOutcomeSucceeded,
  type QuestFeedback,
  type QuestOutcomeStatus,
} from '#/modules/story-flow/quest-outcome'
import { useQuestResultImageQuery, useQuestResultTextQuery } from '#/modules/story-flow/quest-result'
import { useOnboardingStore } from '#/state/onboarding'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, Award, Check, CircleSlash, Flame, ImageIcon, ScrollText, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Route as StartRoute } from '#/routes/story-flow/(onboarding)/name'
import { Route as NextRoute } from "#/routes/story-flow/(loop)/quest/proposal"

type QuestResult = {
  outcomeStatus: QuestOutcomeStatus
  note: string
}

export const Route = createFileRoute('/story-flow/(loop)/quest/result')({
  component: RouteComponent,
  validateSearch: (search): QuestResult => ({
    outcomeStatus: resolveOutcomeStatus(search),
    note: typeof search.note === 'string' ? search.note : '',
  }),
})

function RouteComponent() {
  const navigate = useNavigate()
  const searchParams = Route.useSearch()

  const rawName = useOnboardingStore((state) => state.name)
  const rawGoal = useOnboardingStore((state) => state.goal)
  const rawChallenge = useOnboardingStore((state) => state.mainProblem)

  const name = rawName.trim()
  const goal = rawGoal.trim()
  const challenge = rawChallenge.trim()
  const hasInputs = Boolean(name && goal && challenge)
  const note = searchParams.note.trim()
  const feedback: QuestFeedback = note ? { note } : {}
  const outcomeSucceeded = questOutcomeSucceeded(searchParams.outcomeStatus)
  const [celebrationDone, setCelebrationDone] = useState(!outcomeSucceeded)

  useEffect(() => {
    if (!outcomeSucceeded) {
      setCelebrationDone(true)
      return
    }

    setCelebrationDone(false)
    const timeoutId = window.setTimeout(() => setCelebrationDone(true), 1650)
    return () => window.clearTimeout(timeoutId)
  }, [outcomeSucceeded])

  const canGenerateResult = hasInputs && celebrationDone

  const storyQuery = useStoryBlueprintQuery({ challenge, enabled: canGenerateResult, goal, name })
  const proposalQuery = useQuestProposalQuery({
    challenge,
    enabled: canGenerateResult && Boolean(storyQuery.data),
    goal,
    name,
    storyBlueprint: storyQuery.data,
  })
  const resultTextQuery = useQuestResultTextQuery({
    challenge,
    enabled: canGenerateResult && Boolean(storyQuery.data && proposalQuery.data),
    feedback,
    goal,
    name,
    outcomeStatus: searchParams.outcomeStatus,
    quest: proposalQuery.data?.quest,
    storyBlueprint: storyQuery.data,
    task: proposalQuery.data?.recommendedTask,
  })
  const imageQuery = useQuestResultImageQuery({
    enabled: Boolean(storyQuery.data && proposalQuery.data && resultTextQuery.data),
    outcomeStatus: searchParams.outcomeStatus,
    quest: proposalQuery.data?.quest,
    resultText: resultTextQuery.data,
    storyBlueprint: storyQuery.data,
  })

  if (!hasInputs) {
    return (
      <StoryFrame>
        <div className="flex min-h-svh flex-col justify-between px-5 py-6">
          <div>
            <StoryKicker>Quest result</StoryKicker>
            <StoryHeading accent="missing.">Context</StoryHeading>
            <StoryCopy>
              The story needs a hero, a goal, and a challenge before it can
              turn a quest result into a chronicle entry.
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

  const isLoading =
    storyQuery.isPending ||
    proposalQuery.isPending ||
    resultTextQuery.isPending
  const hasError =
    storyQuery.isError ||
    proposalQuery.isError ||
    resultTextQuery.isError

  return (
    <StoryFrame>
      <main className="min-h-svh px-5 py-6">
        <StoryKicker>{outcomeSucceeded ? 'Quest complete' : 'Quest unresolved'}</StoryKicker>

        {outcomeSucceeded && !celebrationDone && <QuestCompleteCelebration />}

        {celebrationDone && isLoading && <QuestResultLoading outcomeStatus={searchParams.outcomeStatus} />}

        {celebrationDone && hasError && (
          <StorySurface className="mt-12 p-5">
            <h1 className="font-semibold text-foreground">The result could not be written.</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The quest outcome is recorded in this moment, but the narrator
              could not generate the story beat.
            </p>
          </StorySurface>
        )}

        {celebrationDone && resultTextQuery.data && (
          <motion.div
            className="mt-10 pb-5"
            initial={{ opacity: 0, y: outcomeSucceeded ? 22 : 14, scale: outcomeSucceeded ? 0.98 : 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: outcomeSucceeded ? 0.48 : 0.36, ease: 'easeOut' }}
          >
            <ResultStatusCard outcomeStatus={searchParams.outcomeStatus} />

            <QuestResultImage
              imageData={imageQuery.data}
              imageError={imageQuery.isError}
              imagePending={imageQuery.isPending}
              title={resultTextQuery.data.title}
            />

            <StoryHeading className="mt-7" compact>{resultTextQuery.data.title}</StoryHeading>

            <StorySurface
              className="mt-6 p-5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              <div className="space-y-4">
                {resultTextQuery.data.text
                  .split('\n')
                  .filter(Boolean)
                  .map((paragraph) => (
                    <p key={paragraph} className="leading-relaxed text-foreground/85">
                      {paragraph}
                    </p>
                  ))}
              </div>
            </StorySurface>

            {note && <FeedbackNote note={note} />}

            <Button
              className="mt-8 w-full"
              onClick={() => navigate({ to: NextRoute.to })}
              size="hero"
              variant="hero"
            >
              Onto the next quest
              <ArrowRight />
            </Button>
          </motion.div>
        )}
      </main>
    </StoryFrame>
  )
}

function QuestCompleteCelebration() {
  return (
    <motion.div
      className="flex min-h-[calc(100svh-8rem)] flex-col items-center justify-center pb-8 text-center"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.32 }}
    >
      <motion.div
        aria-hidden="true"
        className="relative grid size-32 place-items-center rounded-full border border-accent/30 bg-accent/10 text-accent shadow-[0_0_56px_color-mix(in_srgb,var(--accent)_28%,transparent)]"
        initial={{ scale: 0.72, rotate: -8 }}
        animate={{ scale: [0.72, 1.08, 1], rotate: [-8, 4, 0] }}
        transition={{ duration: 0.62, ease: 'easeOut' }}
      >
        <motion.div
          className="absolute inset-3 rounded-full border border-accent/20"
          animate={{ scale: [1, 1.16, 1], opacity: [0.8, 0.18, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <Check className="size-12" />
      </motion.div>

      <motion.div
        className="mt-7 flex items-center justify-center gap-2 text-primary"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <Sparkles className="size-5" />
        <span className="text-xs font-semibold uppercase tracking-widest">
          Achievement
        </span>
        <Sparkles className="size-5" />
      </motion.div>

      <StoryHeading
        accent="complete."
        className="mt-6"
        compact
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
      >
        Quest
      </StoryHeading>
    </motion.div>
  )
}

function QuestResultLoading({ outcomeStatus }: { outcomeStatus: QuestOutcomeStatus }) {
  const success = questOutcomeSucceeded(outcomeStatus)

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
      <StoryHeading accent="chronicle." compact>
        Writing
      </StoryHeading>
      <StoryCopy wide>
        {success
          ? 'The narrator is shaping your completed quest into a bright mark in the chronicle.'
          : 'The narrator is shaping this unresolved quest into a steady path forward.'}
      </StoryCopy>
    </div>
  )
}

function ResultStatusCard({ outcomeStatus }: { outcomeStatus: QuestOutcomeStatus }) {
  const success = questOutcomeSucceeded(outcomeStatus)
  const Icon = success ? Award : CircleSlash

  return (
    <StorySurface
      className={
        success
          ? 'mb-5 border-accent/30 bg-accent/10 p-5 shadow-[0_0_46px_color-mix(in_srgb,var(--accent)_18%,transparent)]'
          : 'mb-5 border-primary/20 bg-primary/5 p-5'
      }
      initial={{ opacity: 0, y: 12, scale: success ? 0.96 : 1 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        boxShadow: success
          ? [
            '0 0 0 color-mix(in_srgb,var(--accent)_0%,transparent)',
            '0 0 46px color-mix(in_srgb,var(--accent)_18%,transparent)',
            '0 0 24px color-mix(in_srgb,var(--accent)_10%,transparent)',
          ]
          : undefined,
      }}
      transition={{ duration: success ? 0.7 : 0.4, ease: 'easeOut' }}
    >
      <div className="flex items-start gap-3">
        <motion.div
          className={
            success
              ? 'grid size-12 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent'
              : 'grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary'
          }
          animate={success ? { scale: [1, 1.12, 1], rotate: [0, -4, 4, 0] } : undefined}
          transition={success ? { duration: 0.62, delay: 0.16 } : undefined}
        >
          <Icon className="size-6" />
        </motion.div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Outcome
          </p>
          <h2 className="mt-2 text-xl font-semibold leading-tight text-foreground">
            {success ? 'Quest completed' : 'Quest unresolved'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {success
              ? 'The story has a new mark of progress. Read what changed, then choose the next quest.'
              : 'This was not a victory lap. The story is still moving, and the next quest can begin from here.'}
          </p>
        </div>
      </div>
    </StorySurface>
  )
}

function resolveOutcomeStatus(search: Record<string, unknown>): QuestOutcomeStatus {
  if (isQuestOutcomeStatus(search.outcomeStatus)) {
    return search.outcomeStatus
  }

  if (search.success === true || search.success === 'true') {
    return 'completed'
  }

  return 'unresolved'
}

function FeedbackNote({ note }: { note: string }) {
  return (
    <StorySurface className="mt-4 p-5">
      <Accordion type="single" collapsible>
        <AccordionItem value="feedback-note">
          <AccordionTrigger>Feedback note used by the narrator</AccordionTrigger>
          <AccordionContent>
            <p className="leading-relaxed text-muted-foreground">{note}</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </StorySurface>
  )
}

function QuestResultImage({
  imageData,
  imageError,
  imagePending,
  title,
}: {
  imageData: string | undefined
  imageError: boolean
  imagePending: boolean
  title: string
}) {
  return (
    <StorySurface
      className="-mx-2 overflow-hidden bg-background/65"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
    >
      {imagePending && (
        <div className="flex aspect-video flex-col items-center justify-center gap-4 px-8 text-center text-muted-foreground">
          <ImageIcon className="size-9 text-accent" />
          <p>The scene is taking shape.</p>
        </div>
      )}

      {imageError && (
        <div className="flex aspect-video flex-col items-center justify-center gap-4 px-8 text-center text-muted-foreground">
          <Flame className="size-9 text-primary" />
          <p>The story beat is ready, but the scene could not be drawn.</p>
        </div>
      )}

      {imageData && (
        <img
          alt={title}
          className="aspect-video w-full bg-background object-contain"
          src={`data:image/png;base64,${imageData}`}
        />
      )}
    </StorySurface>
  )
}
