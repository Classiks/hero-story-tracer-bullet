import { cn } from '#/lib/utils'
import { Button } from '#/components/ui/button'
import { ImageIcon, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { RotatingLoadingText } from '#/components/story-flow/rotating-loading-text'

const pendingMessages = [
  'Summoning the scene from the page...',
  'Turning prose into pixels...',
  'Sketching between the lines...',
  'Letting the story find its colors...',
  'Composing the next visual beat...',
  'Warming up the imagination engine...',
  'Gathering light, shadow, and a little drama...',
  'Giving the scene its first breath...',
  'Painting what the words implied...',
  'Finding the mood behind the moment...',
  'Threading atmosphere into the frame...',
  'Shaping characters out of the mist...',
  'Mixing ink, color, and narrative tension...',
  'Framing the scene just right...',
  'Coaxing the image out of the story...',
  'Adding texture to the tale...',
  'Bringing the paragraph into focus...',
  'Polishing the visual subplot...',
  'Letting the scene step onto the stage...',
  'Rendering the unwritten details...',
]

export function GeneratedImagePlaceholder({
  className,
  error = false,
  isRetrying = false,
  onRetry,
}: {
  className?: string
  error?: boolean
  isRetrying?: boolean
  onRetry?: () => void
}) {
  return (
    <div
      className={cn(
        'relative flex aspect-video flex-col items-center justify-center overflow-hidden px-8 text-center',
        error ? 'text-muted-foreground' : 'text-foreground',
        className,
      )}
    >
      {!error && (
        <>
          <motion.div
            aria-hidden="true"
            className="absolute size-44 rounded-full border border-accent/20 bg-accent/10 blur-sm"
            animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.86, 1.08, 0.86] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden="true"
            className="absolute size-28 rounded-[2rem] border border-primary/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
        </>
      )}

      <motion.div
        className={cn(
          'relative grid size-14 place-items-center rounded-2xl',
          error ? 'bg-primary/10 text-primary' : 'bg-accent/15 text-accent',
        )}
        animate={error ? undefined : { y: [0, -4, 0], scale: [1, 1.06, 1] }}
        transition={error ? undefined : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        {error ? <ImageIcon className="size-7" /> : <Sparkles className="size-7" />}
      </motion.div>

      <div className="relative mt-5 min-h-14">
        {error ? (
          <>
            <p className="font-semibold text-foreground">The scene could not be drawn.</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The story text is ready. Try drawing the image again.
            </p>
            {onRetry && (
              <Button
                className="mt-4"
                disabled={isRetrying}
                onClick={onRetry}
                size="sm"
                type="button"
                variant="outline"
              >
                {isRetrying ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                Try again
              </Button>
            )}
          </>
        ) : (
          <RotatingLoadingText messages={pendingMessages} />
        )}
      </div>
    </div>
  )
}
