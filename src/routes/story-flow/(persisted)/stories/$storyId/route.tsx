import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/story-flow/(persisted)/stories/$storyId')({
  component: Outlet,
})
