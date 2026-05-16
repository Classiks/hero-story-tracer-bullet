import { Outlet, createFileRoute } from '@tanstack/react-router'

// Required parent route so TanStack Router can attach nested story routes under $storyId.
export const Route = createFileRoute('/story-flow/(persisted)/stories/$storyId')({
  component: Outlet,
})
