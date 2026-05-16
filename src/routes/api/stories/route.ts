import { createFileRoute } from '@tanstack/react-router'

// Required parent route so TanStack Router can attach /api/stories/$storyId children.
export const Route = createFileRoute('/api/stories')({})
