import { useProblemStore } from '#/state/problem'
import { useUserStore } from '#/state/user'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/story-flow/(onboarding)/story')({
  component: RouteComponent,
})

function RouteComponent() {
  const { name } = useUserStore()
  const { mainProblem } = useProblemStore()

  return <div>
    <p>Name: {name}</p>
    <p>Problem: {mainProblem}</p>
  </div>
}
