import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Route as StoryFlowRoute } from '#/routes/story-flow/index'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()

  useEffect(() => {
    void navigate({ replace: true, to: StoryFlowRoute.to })
  }, [navigate])

  return null
}
