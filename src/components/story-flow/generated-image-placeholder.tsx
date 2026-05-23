import { cn } from '#/lib/utils'
import { ImageIcon, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const pendingMessages = [
  'Generating your image...',
  'Drawing the vision...',
  'Painting the scene...',
  'Adding the final glow...',
]

export function GeneratedImagePlaceholder({
  className,
  error = false,
}: {
  className?: string
  error?: boolean
}) {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    if (error) {
      return
    }

    const timer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % pendingMessages.length)
    }, 1900)

    return () => window.clearInterval(timer)
  }, [error])

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
              The story text is ready, and the image can be tried again by reloading this page.
            </p>
          </>
        ) : (
          <AnimatePresence mode="wait">
            <motion.p
              key={pendingMessages[messageIndex]}
              className="font-semibold text-foreground"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24 }}
            >
              {pendingMessages[messageIndex]}
            </motion.p>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
