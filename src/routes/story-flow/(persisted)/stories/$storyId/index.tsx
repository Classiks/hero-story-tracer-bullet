import { Button } from '#/components/ui/button'
import {
  StoryCopy,
  StoryFrame,
  StoryHeading,
  StorySurface,
} from '#/components/story-flow/story-primitives'
import { StoryRouteHeader } from '#/components/story-flow/story-route-header'
import { useStorySessionQuery } from '#/modules/story-flow/story-api-client'
import type { PersistedQuest, StoryProgress } from '#/modules/story-flow/persisted-types'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, CheckCircle2, CircleSlash, Clock3, ScrollText, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { Route as LandingRoute } from '#/routes/story-flow/index'

export const Route = createFileRoute('/story-flow/(persisted)/stories/$storyId/')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const { storyId } = Route.useParams()
  const sessionQuery = useStorySessionQuery(storyId)
  const session = sessionQuery.data

  return (
    <StoryFrame>
      <main className="min-h-svh px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36 }}
        >
          <StoryRouteHeader>Story progress</StoryRouteHeader>

          {sessionQuery.isPending && <HubLoading />}

          {sessionQuery.isError && (
            <StorySurface className="mt-12 p-5">
              <h1 className="font-semibold text-foreground">The story could not be loaded.</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Go back to your stories or try opening this one again later.
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

          {session && (
            <div className="mt-10 pb-5">
              <StoryHeading compact>{session.story.blueprint.title}</StoryHeading>
              <StoryCopy className="max-w-none text-foreground/80">
                {session.story.blueprint.storyBlurb}
              </StoryCopy>

              <ProgressSummary progress={session.progress} />

              <Button
                className="mt-6 w-full"
                onClick={() => {
                  if (
                    session.progress.nextAction === 'finish_accepted_quest' &&
                    session.progress.currentQuest
                  ) {
                    void navigate({
                      params: { questId: session.progress.currentQuest.id, storyId },
                      to: '/story-flow/stories/$storyId/quest/$questId/feedback',
                    })
                    return
                  }

                  void navigate({
                    params: { storyId },
                    to: '/story-flow/stories/$storyId/quest/proposal',
                  })
                }}
                size="hero"
                variant="hero"
              >
                {getNextActionLabel(session.progress.nextAction)}
                <ArrowRight />
              </Button>

              <QuestHistory quests={session.recentQuests} />
            </div>
          )}
        </motion.div>
      </main>
    </StoryFrame>
  )
}

function HubLoading() {
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
      <StoryHeading accent="path." compact>
        Reading
      </StoryHeading>
      <StoryCopy wide>The narrator is opening the current story path.</StoryCopy>
    </div>
  )
}

function ProgressSummary({ progress }: { progress: StoryProgress }) {
  return (
    <StorySurface className="mt-6 p-5">
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent">
          <Sparkles className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold leading-tight text-foreground">
            {getProgressHeading(progress)}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {getProgressCopy(progress)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <ProgressCount icon={<CheckCircle2 className="size-4" />} label="Done" value={progress.counts.completed} />
        <ProgressCount icon={<CircleSlash className="size-4" />} label="Unresolved" value={progress.counts.unresolved} />
        <ProgressCount icon={<Clock3 className="size-4" />} label="Current" value={progress.currentQuest ? 1 : 0} />
      </div>
    </StorySurface>
  )
}

function ProgressCount({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-3 text-center">
      <div className="mx-auto grid size-7 place-items-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
      <p className="text-[0.68rem] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  )
}

function QuestHistory({ quests }: { quests: PersistedQuest[] }) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Recent quests
      </h2>

      {!quests.length && (
        <StorySurface className="mt-3 p-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            No quests yet. Start the first one to begin the record.
          </p>
        </StorySurface>
      )}

      <div className="mt-3 grid gap-3">
        {quests.map((quest) => (
          <StorySurface key={quest.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Quest {quest.sequenceNumber} · {getStatusLabel(quest.status)}
                </p>
                <h3 className="mt-2 font-semibold leading-tight text-foreground">
                  {quest.quest.quest}
                </h3>
                {quest.resultText && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {quest.resultText.title}
                  </p>
                )}
              </div>
              <StatusIcon status={quest.status} />
            </div>
          </StorySurface>
        ))}
      </div>
    </section>
  )
}

function StatusIcon({ status }: { status: PersistedQuest['status'] }) {
  const icon =
    status === 'completed' ? (
      <CheckCircle2 className="size-5" />
    ) : status === 'unresolved' || status === 'rejected' ? (
      <CircleSlash className="size-5" />
    ) : (
      <Clock3 className="size-5" />
    )

  return (
    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
      {icon}
    </div>
  )
}

function getNextActionLabel(action: StoryProgress['nextAction']) {
  switch (action) {
    case 'finish_accepted_quest':
      return 'Finish quest'
    case 'get_next_quest':
      return 'Get next quest'
    case 'review_proposal':
      return 'Review quest'
    case 'start_first_quest':
      return 'Start first quest'
  }
}

function getProgressHeading(progress: StoryProgress) {
  switch (progress.nextAction) {
    case 'finish_accepted_quest':
      return 'A quest is underway'
    case 'get_next_quest':
      return 'Ready for the next step'
    case 'review_proposal':
      return 'A quest is waiting'
    case 'start_first_quest':
      return 'The story is ready'
  }
}

function getProgressCopy(progress: StoryProgress) {
  switch (progress.nextAction) {
    case 'finish_accepted_quest':
      return 'Return to the accepted quest and record how it went.'
    case 'get_next_quest':
      return 'The last quest is recorded. Generate the next step when you are ready.'
    case 'review_proposal':
      return 'Review the proposed quest, accept it, or ask for another one.'
    case 'start_first_quest':
      return 'Start the first quest and begin building the story history.'
  }
}

function getStatusLabel(status: PersistedQuest['status']) {
  switch (status) {
    case 'accepted':
      return 'accepted'
    case 'completed':
      return 'completed'
    case 'proposed':
      return 'proposed'
    case 'rejected':
      return 'rejected'
    case 'unresolved':
      return 'unresolved'
  }
}
