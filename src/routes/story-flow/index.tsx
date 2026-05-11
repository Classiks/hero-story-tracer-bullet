import { StoryCopy, StoryFrame, StoryHeading } from '#/components/story-flow/story-primitives'
import { useStoriesQuery } from '#/modules/story-flow/story-api-client'
import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { Route as StartingRoute } from '#/routes/story-flow/(onboarding)/name'
import { Route as StoryHubRoute } from '#/routes/story-flow/(persisted)/stories/$storyId/index'

export const Route = createFileRoute('/story-flow/')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const storiesQuery = useStoriesQuery()

  useEffect(() => {
    if (!storiesQuery.isSuccess) {
      return
    }

    const activeStory = storiesQuery.data.stories.find((story) => story.status === 'active')

    if (activeStory) {
      void navigate({
        params: { storyId: activeStory.id },
        replace: true,
        to: StoryHubRoute.to,
      })
      return
    }

    void navigate({ replace: true, to: StartingRoute.to })
  }, [navigate, storiesQuery.data, storiesQuery.isSuccess])

  return (
    <StoryFrame>
      <main className="min-h-svh px-5 py-6">
        <div className="mt-12">
          <motion.div
            aria-hidden="true"
            className="mx-auto size-28 rounded-full border border-accent/20 bg-accent/10"
            animate={{ rotate: 360, scale: [1, 1.04, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          />
          <StoryHeading accent="story." compact>
            Opening
          </StoryHeading>
          <StoryCopy wide>The narrator is finding your active story.</StoryCopy>
        </div>
      </main>
    </StoryFrame>
  )
}
