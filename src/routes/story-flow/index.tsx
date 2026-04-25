import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Route as StartingRoute } from '#/routes/story-flow/(onboarding)/name';

export const Route = createFileRoute('/story-flow/')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate({ to: StartingRoute.to })
  }, [])

  return <div>Hello "/story-flow/"!</div>
}
