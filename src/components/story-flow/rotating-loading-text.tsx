import { cn } from '#/lib/utils'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

function getRandomMessageIndex(currentIndex: number, messageCount: number) {
  if (messageCount <= 1) {
    return 0
  }

  let nextIndex = currentIndex

  while (nextIndex === currentIndex) {
    nextIndex = Math.floor(Math.random() * messageCount)
  }

  return nextIndex
}

export function RotatingLoadingText({
  className,
  intervalMs = 4800,
  messages,
}: {
  className?: string
  intervalMs?: number
  messages: readonly string[]
}) {
  const prefersReducedMotion = useReducedMotion()
  const [messageIndex, setMessageIndex] = useState(() =>
    Math.floor(Math.random() * Math.max(messages.length, 1)),
  )
  const message = messages[messageIndex] ?? messages[0]

  useEffect(() => {
    if (prefersReducedMotion || messages.length <= 1) {
      return
    }

    const timer = window.setInterval(() => {
      setMessageIndex((current) => getRandomMessageIndex(current, messages.length))
    }, intervalMs)

    return () => window.clearInterval(timer)
  }, [intervalMs, messages.length, prefersReducedMotion])

  if (!message) {
    return null
  }

  if (prefersReducedMotion) {
    return <p className={cn('font-semibold text-foreground', className)}>{message}</p>
  }

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={message}
        className={cn('font-semibold text-foreground', className)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.24 }}
      >
        {message}
      </motion.p>
    </AnimatePresence>
  )
}
