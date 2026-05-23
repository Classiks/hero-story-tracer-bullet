import { Button } from '#/components/ui/button'
import {
  StoryCopy,
  StoryFrame,
  StoryHeading,
  StoryWaitState,
} from '#/components/story-flow/story-primitives'
import { StoryRouteHeader } from '#/components/story-flow/story-route-header'
import { useCreateStoryMutation } from '#/modules/story-flow/story-api-client'
import { useOnboardingStore } from '#/state/onboarding'
import { useAppNavigate } from '#/lib/use-app-navigate'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, ScrollText } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Route as StartRoute } from '#/routes/story-flow/(onboarding)/name'

export const Route = createFileRoute('/story-flow/(onboarding)/blurb')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useAppNavigate()
  const rawName = useOnboardingStore((state) => state.name)
  const rawGoal = useOnboardingStore((state) => state.goal)
  const rawChallenge = useOnboardingStore((state) => state.mainProblem)
  const storyRequestId = useOnboardingStore((state) => state.storyRequestId)
  const refreshStoryRequestId = useOnboardingStore((state) => state.refreshStoryRequestId)
  const createStory = useCreateStoryMutation()
  const requested = useRef(false)
  const [createError, setCreateError] = useState(false)

  const name = rawName.trim()
  const goal = rawGoal.trim()
  const challenge = rawChallenge.trim()
  const hasInputs = Boolean(name && goal && challenge)

  useEffect(() => {
    if (!hasInputs || requested.current) {
      return
    }

    requested.current = true
    setCreateError(false)

    void createStory
      .mutateAsync({ challenge, clientRequestId: storyRequestId, goal, name })
      .then(({ story }) => {
        return navigate({
          params: { storyId: story.id },
          replace: true,
          to: '/story-flow/stories/$storyId/blurb',
        }).then(() => {
          refreshStoryRequestId()
        })
      })
      .catch(() => {
        setCreateError(true)
        requested.current = false
      })
  }, [challenge, createStory, goal, hasInputs, name, navigate, refreshStoryRequestId, storyRequestId])

  if (!hasInputs) {
    return (
      <StoryFrame>
        <div className="flex min-h-svh flex-col justify-between px-5 py-6">
          <div>
            <StoryRouteHeader>Chronicle waiting</StoryRouteHeader>
            <StoryHeading accent="pieces.">Missing</StoryHeading>
            <StoryCopy>
              The story needs a hero, a quest, and a challenge before it can
              shape the journey.
            </StoryCopy>
          </div>

          <Button
            onClick={() => navigate({ to: StartRoute.to })}
            size="hero"
            variant="hero"
          >
            <ArrowLeft />
            Start again
          </Button>
        </div>
      </StoryFrame>
    )
  }

  return (
    <StoryFrame>
      <main className="min-h-svh px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36 }}
        >
          <StoryRouteHeader>Story blueprint</StoryRouteHeader>

          {createError ? (
            <div className="mt-12 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-foreground">
              The chronicle failed to form. Step back and try the story again later.
            </div>
          ) : (
            <StoryLoading name={name} />
          )}
        </motion.div>
      </main>
    </StoryFrame>
  )
}

function StoryLoading({ name }: { name: string }) {
  return (
    <StoryWaitState
      body={`The narrator is reading the path ahead for ${name}, turning the goal into a quest, and shaping the challenge into something that can be faced.`}
      heading="Forging your chronicle"
      icon={<ScrollText className="size-9" />}
      messages={[
        'Finding the shape of the journey...',
        'Naming the hero, threat, and reward...',
        'Turning real stakes into story fuel...',
        'Sharpening the first page of the chronicle...',
        'Giving the goal a world to live in...',
      ]}
    />
  )
}
