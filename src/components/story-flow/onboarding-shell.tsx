import { motion } from 'framer-motion'

import { StoryEyebrow, StoryFrame } from './story-primitives'
import { StoryRouteHeader } from './story-route-header'
import type { ReactNode } from 'react'

interface OnboardingShellProps {
  action: ReactNode
  children: ReactNode
  chapter: string
  eyebrow: string
}

const appear = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
}

export function OnboardingShell({
  action,
  children,
  chapter,
  eyebrow,
}: OnboardingShellProps) {
  return (
    <StoryFrame panelClassName="flex flex-col justify-between gap-6 overflow-hidden px-5 py-6">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-12 size-44 -translate-x-1/2 rounded-full border border-accent/10"
        animate={{ rotate: 360, scale: [1, 1.06, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        className="relative flex min-h-full flex-1 flex-col justify-between"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.12, delayChildren: 0.08 },
          },
        }}
      >
        <div>
          <motion.div variants={appear}>
            <StoryRouteHeader>{chapter}</StoryRouteHeader>
          </motion.div>
          <StoryEyebrow variants={appear}>{eyebrow}</StoryEyebrow>
          {children}
        </div>

        <motion.div
          variants={appear}
          transition={{ type: 'spring', stiffness: 150, damping: 18 }}
        >
          {action}
        </motion.div>
      </motion.div>
    </StoryFrame>
  )
}
