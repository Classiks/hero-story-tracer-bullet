import { Button } from '#/components/ui/button'
import {
  StoryCopy,
  StoryFrame,
  StoryHeading,
  StorySurface,
  StoryWaitState,
} from '#/components/story-flow/story-primitives'
import { StoryRouteHeader } from '#/components/story-flow/story-route-header'
import { GeneratedImagePlaceholder } from '#/components/story-flow/generated-image-placeholder'
import { useGenerateStoryImageMutation, useStoryQuery } from '#/modules/story-flow/story-api-client'
import type { PersistedStory } from '#/modules/story-flow/persisted-types'
import { useOnboardingStore } from '#/state/onboarding'
import { useAppNavigate } from '#/lib/use-app-navigate'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, Crown, Flame, Gem, ScrollText, ShieldAlert } from 'lucide-react'
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
  const navigate = useAppNavigate()
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
    <StoryWaitState
      body="The narrator is opening the saved chronicle."
      heading="Loading"
      headingAccent="the chronicle."
      icon={<ScrollText className="size-9" />}
      messages={[
        'Finding the title page...',
        'Dusting off the first chapter...',
        'Reading the world back into view...',
      ]}
    />
  )
}

function StoryPresentation({ story }: { story: PersistedStory }) {
  const navigate = useAppNavigate()
  const generateStoryImage = useGenerateStoryImageMutation(story.id)
  const blueprint = story.blueprint
  const imageMissing = !story.storyImageUrl
  const { isError: imageError, isIdle: imageIdle, mutate: generateImage } = generateStoryImage

  useEffect(() => {
    if (imageMissing && imageIdle) {
      generateImage()
    }
  }, [generateImage, imageIdle, imageMissing])

  return (
    <div className="mt-10 pb-5">
      <StoryImageBanner
        imageError={imageError}
        imageUrl={story.storyImageUrl}
        title={blueprint.title}
      />

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
        <MetaphorCard
          icon={<Crown className="size-5" />}
          index={0}
          label="Hero"
          value={blueprint.metaphors.hero}
        />
        <MetaphorCard
          icon={<ShieldAlert className="size-5" />}
          index={1}
          label="Challenge"
          value={blueprint.metaphors.enemy}
        />
        <MetaphorCard
          icon={<Gem className="size-5" />}
          index={2}
          label="Reward"
          value={blueprint.metaphors.reward}
        />
      </div>

      <Button
        className="mt-10 w-full"
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

function StoryImageBanner({
  imageError,
  imageUrl,
  title,
}: {
  imageError: boolean
  imageUrl: string | null
  title: string
}) {
  return (
    <StorySurface
      className="-mx-2 overflow-hidden bg-background/65"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {!imageUrl && (
        <GeneratedImagePlaceholder error={imageError} />
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
  index,
  label,
  value,
}: {
  icon: React.ReactNode
  index: number
  label: string
  value: string
}) {
  return (
    <StorySurface
      className="flex items-center gap-3 rounded-2xl p-4"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + index * 0.05 }}
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
