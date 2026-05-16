import { Button } from '#/components/ui/button'
import {
  StoryCopy,
  StoryFrame,
  StoryHeading,
  StoryKicker,
  StorySurface,
} from '#/components/story-flow/story-primitives'
import { useStoriesQuery } from '#/modules/story-flow/story-api-client'
import type { PersistedStory } from '#/modules/story-flow/persisted-types'
import { useOnboardingStore } from '#/state/onboarding'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight, BookOpen, ImageIcon, Plus, RefreshCcw } from 'lucide-react'
import { motion } from 'framer-motion'
import { Route as StartingRoute } from '#/routes/story-flow/(onboarding)/name'
import { Route as StoryHubRoute } from '#/routes/story-flow/(persisted)/stories/$storyId'

export const Route = createFileRoute('/story-flow/')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const storiesQuery = useStoriesQuery()
  const resetOnboarding = useOnboardingStore((state) => state.reset)
  const stories = storiesQuery.data?.stories ?? []
  const activeStories = stories.filter((story) => story.status === 'active')
  const completedStories = stories.filter((story) => story.status === 'completed')
  const archivedStories = stories.filter((story) => story.status === 'archived')

  const startStory = () => {
    resetOnboarding()
    void navigate({ to: StartingRoute.to })
  }

  return (
    <StoryFrame>
      <main className="min-h-svh px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36 }}
        >
          <StoryKicker>Your stories</StoryKicker>

          {storiesQuery.isPending && <LandingLoading />}

          {storiesQuery.isError && (
            <StorySurface className="mt-12 p-5">
              <h1 className="font-semibold text-foreground">Your stories could not be loaded.</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Try again, or start a new story if the list is still unavailable.
              </p>
              <Button
                className="mt-5 w-full"
                onClick={() => void storiesQuery.refetch()}
                size="hero"
                variant="hero"
              >
                <RefreshCcw />
                Try again
              </Button>
            </StorySurface>
          )}

          {storiesQuery.isSuccess && stories.length === 0 && (
            <EmptyLanding onStartStory={startStory} />
          )}

          {storiesQuery.isSuccess && stories.length > 0 && (
            <div className="mt-10 pb-5">
              <StoryHeading compact>Choose the story.</StoryHeading>
              <StoryCopy className="max-w-none text-foreground/80">
                Continue any saved path or begin a new one when the next goal needs its own chronicle.
              </StoryCopy>

              <Button
                className="mt-6 w-full"
                onClick={startStory}
                size="hero"
                variant="hero"
              >
                <Plus />
                New story
              </Button>

              <section className="mt-8">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  Active stories
                </h2>
                {activeStories.length ? (
                  <StoryList stories={activeStories} />
                ) : (
                  <StorySurface className="mt-3 p-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      No active stories right now. Restore an archived or completed story, or start a new one.
                    </p>
                  </StorySurface>
                )}
              </section>

              {completedStories.length > 0 && (
                <StorySection heading="Completed stories" stories={completedStories} />
              )}

              {archivedStories.length > 0 && (
                <StorySection heading="Archived stories" stories={archivedStories} />
              )}
            </div>
          )}
        </motion.div>
      </main>
    </StoryFrame>
  )
}

function LandingLoading() {
  return (
    <div className="mt-12">
      <motion.div
        aria-hidden="true"
        className="mx-auto grid size-28 place-items-center rounded-full border border-accent/20 bg-accent/10 text-accent"
        animate={{ rotate: 360, scale: [1, 1.04, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      >
        <BookOpen className="size-9" />
      </motion.div>
      <StoryHeading accent="stories." compact>
        Opening
      </StoryHeading>
      <StoryCopy wide>The narrator is finding your saved paths.</StoryCopy>
    </div>
  )
}

function EmptyLanding({ onStartStory }: { onStartStory: () => void }) {
  return (
    <div className="mt-12 pb-5">
      <motion.div
        aria-hidden="true"
        className="mx-auto grid size-28 place-items-center rounded-full border border-accent/20 bg-accent/10 text-accent"
        animate={{ rotate: 360, scale: [1, 1.04, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      >
        <BookOpen className="size-9" />
      </motion.div>
      <StoryHeading accent="story.">Start your</StoryHeading>
      <StoryCopy wide>
        Give the narrator a hero, a goal, and a challenge. Your saved stories will gather here.
      </StoryCopy>
      <Button
        className="mt-8 w-full"
        onClick={onStartStory}
        size="hero"
        variant="hero"
      >
        <Plus />
        Start first story
      </Button>
    </div>
  )
}

function StorySection({ heading, stories }: { heading: string; stories: PersistedStory[] }) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {heading}
      </h2>
      <StoryList stories={stories} />
    </section>
  )
}

function StoryList({ stories }: { stories: PersistedStory[] }) {
  return (
    <div className="mt-3 grid gap-2.5">
      {stories.map((story) => (
        <StoryRow key={story.id} story={story} />
      ))}
    </div>
  )
}

function StoryRow({ story }: { story: PersistedStory }) {
  const navigate = Route.useNavigate()

  return (
    <StorySurface className="flex items-center gap-3 p-3">
      <div className="h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-background/65">
        {story.storyImageUrl ? (
          <img
            alt={story.blueprint.title}
            className="size-full object-cover"
            src={story.storyImageUrl}
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <ImageIcon className="size-5 text-accent" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold leading-tight text-foreground">
          {story.blueprint.title}
        </h3>
        <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
          {formatUpdatedAt(story.updatedAt)}
          {story.status !== 'active' ? ` · ${story.status}` : ''}
        </p>
      </div>

      <Button
        aria-label={`Continue ${story.blueprint.title}`}
        className="size-10 rounded-xl"
        onClick={() =>
          void navigate({
            params: { storyId: story.id },
            to: StoryHubRoute.to,
          })
        }
        size="icon"
        variant="hero"
      >
        <ArrowRight className="size-4" />
      </Button>
    </StorySurface>
  )
}

function formatUpdatedAt(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Updated recently'
  }

  return `Updated ${new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
  }).format(date)}`
}
