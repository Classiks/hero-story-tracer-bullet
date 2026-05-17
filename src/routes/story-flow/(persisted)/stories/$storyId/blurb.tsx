import { Button } from '#/components/ui/button'
import {
  StoryCopy,
  StoryFrame,
  StoryHeading,
  StorySurface,
} from '#/components/story-flow/story-primitives'
import { StoryRouteHeader } from '#/components/story-flow/story-route-header'
import { useStoryQuery } from '#/modules/story-flow/story-api-client'
import type { PersistedStory } from '#/modules/story-flow/persisted-types'
import { useOnboardingStore } from '#/state/onboarding'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, Crown, Flame, Gem, ImageIcon, ShieldAlert } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { Route as LandingRoute } from '#/routes/story-flow/index'
import { Route as StoryHubRoute } from '#/routes/story-flow/(persisted)/stories/$storyId'
import { playSoundEffect } from '#/lib/sound-effects'

export const Route = createFileRoute('/story-flow/(persisted)/stories/$storyId/blurb')({
  component: RouteComponent,
})

const playedLevelUpKeys = new Set<string>()

function RouteComponent() {
  const navigate = useNavigate()
  const { storyId } = Route.useParams()
  const storyQuery = useStoryQuery(storyId)
  const setName = useOnboardingStore((state) => state.setName)
  const setGoal = useOnboardingStore((state) => state.setGoal)
  const setMainProblem = useOnboardingStore((state) => state.setMainProblem)
  const story = storyQuery.data?.story

  useEffect(() => {
    if (!story) {
      return
    }

    setName(story.name)
    setGoal(story.goal)
    setMainProblem(story.challenge)
  }, [setGoal, setMainProblem, setName, story])

  useEffect(() => {
    if (!story) {
      return
    }

    const audioKey = [story.id, story.blueprint.title].join('|')

    if (playedLevelUpKeys.has(audioKey)) {
      return
    }

    playedLevelUpKeys.add(audioKey)
    playSoundEffect('levelUp')
  }, [story])

  return (
    <StoryFrame>
      <main className="min-h-svh px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36 }}
        >
          <StoryRouteHeader>Story blueprint</StoryRouteHeader>

          {storyQuery.isPending && <StoryLoading />}

          {storyQuery.isError && (
            <div className="mt-12">
              <ErrorState message="The chronicle could not be loaded." />
              <Button
                className="mt-6 w-full"
                onClick={() => navigate({ to: LandingRoute.to })}
                size="hero"
                variant="hero"
              >
                <ArrowLeft />
                Back to stories
              </Button>
            </div>
          )}

          {story && <StoryPresentation story={story} />}
        </motion.div>
      </main>
    </StoryFrame>
  )
}

function StoryLoading() {
  return (
    <div className="mt-12">
      <motion.div
        aria-hidden="true"
        className="mx-auto size-28 rounded-full border border-accent/20 bg-accent/10"
        animate={{ rotate: 360, scale: [1, 1.04, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      />
      <StoryHeading accent="the chronicle." compact>
        Loading
      </StoryHeading>
      <StoryCopy wide>The narrator is opening the saved chronicle.</StoryCopy>
    </div>
  )
}

function StoryPresentation({ story }: { story: PersistedStory }) {
  const navigate = useNavigate()
  const blueprint = story.blueprint

  return (
    <div className="mt-10 pb-5">
      <StoryImageBanner imageUrl={story.storyImageUrl} title={blueprint.title} />

      <StoryHeading
        className="mt-7"
        compact
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {blueprint.title}
      </StoryHeading>

      <StoryCopy
        className="max-w-none text-foreground/80"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        {blueprint.storyBlurb}
      </StoryCopy>

      <div className="mt-5 grid gap-3">
        <MetaphorCard icon={<Crown className="size-5" />} label="Hero" value={blueprint.metaphors.hero} />
        <MetaphorCard
          icon={<ShieldAlert className="size-5" />}
          label="Challenge"
          value={blueprint.metaphors.enemy}
        />
        <MetaphorCard icon={<Gem className="size-5" />} label="Reward" value={blueprint.metaphors.reward} />
      </div>

      <Button
        className="mt-10 w-full"
        disabled={!story.storyImageUrl}
        onClick={() =>
          navigate({
            params: { storyId: story.id },
            to: StoryHubRoute.to,
          })
        }
        size="hero"
        variant="hero"
      >
        Continue <ArrowRight />
      </Button>
    </div>
  )
}

function StoryImageBanner({ imageUrl, title }: { imageUrl: string | null; title: string }) {
  return (
    <StorySurface
      className="-mx-2 overflow-hidden bg-background/65"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {!imageUrl && (
        <div className="flex aspect-video flex-col items-center justify-center gap-4 px-8 text-center text-muted-foreground">
          <ImageIcon className="size-9 text-accent" />
          <p>The banner is taking shape.</p>
        </div>
      )}

      {imageUrl && (
        <img
          alt={title}
          className="aspect-video w-full bg-background object-contain"
          src={imageUrl}
        />
      )}
    </StorySurface>
  )
}

function MetaphorCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <StorySurface
      className="flex items-center gap-3 rounded-2xl p-4"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="grid size-10 place-items-center rounded-xl bg-accent/10 text-accent">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
      </div>
    </StorySurface>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-foreground">
      <div className="flex items-center gap-3">
        <Flame className="size-5 text-primary" />
        {message}
      </div>
    </div>
  )
}
