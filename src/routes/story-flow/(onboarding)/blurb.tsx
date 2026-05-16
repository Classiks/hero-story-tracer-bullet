import { Button } from '#/components/ui/button'
import { StoryCopy, StoryFrame, StoryHeading, StoryKicker } from '#/components/story-flow/story-primitives'
import { useCreateStoryMutation } from '#/modules/story-flow/story-api-client'
import { useOnboardingStore } from '#/state/onboarding'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Route as StartRoute } from '#/routes/story-flow/(onboarding)/name'

export const Route = createFileRoute('/story-flow/(onboarding)/blurb')({
  component: RouteComponent,
})

function RouteComponent() {
  // Bind navigation to this file route. The global hook did not reliably
  // resolve the post-create transition across the pathless route groups.
  const navigate = Route.useNavigate()
  const rawName = useOnboardingStore((state) => state.name)
  const rawGoal = useOnboardingStore((state) => state.goal)
  const rawChallenge = useOnboardingStore((state) => state.mainProblem)
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
      .mutateAsync({ challenge, goal, name })
      .then(({ story }) => {
        return navigate({
          params: { storyId: story.id },
          replace: true,
          to: '/story-flow/stories/$storyId/blurb',
        })
      })
      .catch(() => {
        setCreateError(true)
        requested.current = false
      })
  }, [challenge, createStory, goal, hasInputs, name, navigate])

  if (!hasInputs) {
    return (
      <StoryFrame>
        <div className="flex min-h-svh flex-col justify-between px-5 py-6">
          <div>
            <StoryKicker>Chronicle waiting</StoryKicker>
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
          <StoryKicker>Story blueprint</StoryKicker>

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
    <div className="mt-12">
      <motion.div
        aria-hidden="true"
        className="mx-auto size-28 rounded-full border border-accent/20 bg-accent/10"
        animate={{ rotate: 360, scale: [1, 1.04, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      />
      <StoryHeading accent="the chronicle." compact>
        Forging
      </StoryHeading>
      <StoryCopy wide>
        The narrator is turning {name} into a hero, the goal into a quest, and
        the challenge into something that can be faced.
      </StoryCopy>
    </div>
  )
}
