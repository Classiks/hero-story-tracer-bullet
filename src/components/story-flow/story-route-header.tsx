import { Button } from '#/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '#/components/ui/tooltip'
import { Route as LandingRoute } from '#/routes/story-flow/index'
import { useNavigate } from '@tanstack/react-router'
import { Library } from 'lucide-react'

import { StoryKicker } from './story-primitives'

import type { ReactNode } from 'react'

export function StoryRouteHeader({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between gap-3">
      <StoryKicker>{children}</StoryKicker>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label="Back to stories"
            onClick={() => navigate({ to: LandingRoute.to })}
            size="icon-sm"
            variant="outline"
            sound={false}
          >
            <Library className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Back to stories</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
