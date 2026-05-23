import { Button } from '#/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '#/components/ui/tooltip'
import { useAppNavigate } from '#/lib/use-app-navigate'
import { Route as LandingRoute } from '#/routes/story-flow/index'
import { Home } from 'lucide-react'

import { StoryKicker } from './story-primitives'

import type { ReactNode } from 'react'

export function StoryRouteHeader({
  actions,
  children,
  showHomeAction = true,
}: {
  actions?: ReactNode
  children: ReactNode
  showHomeAction?: boolean
}) {
  const navigate = useAppNavigate()

  return (
    <div className="flex items-center justify-between gap-3">
      <StoryKicker>{children}</StoryKicker>

      <div className="flex items-center gap-2">
        {actions}
        {showHomeAction && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Back to stories"
                onClick={() => navigate({ to: LandingRoute.to })}
                size="icon-sm"
                variant="outline"
              >
                <Home className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Back to stories</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
