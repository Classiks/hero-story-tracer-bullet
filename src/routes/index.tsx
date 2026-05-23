import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAppNavigate } from '#/lib/use-app-navigate'
import { Route as StoryFlowRoute } from '#/routes/story-flow/index'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useAppNavigate()

  useEffect(() => {
    void navigate({ replace: true, to: StoryFlowRoute.to })
  }, [navigate])

  return null
}
