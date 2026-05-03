import { cn } from '#/lib/utils'
import { motion } from 'framer-motion'

import type { ComponentProps, ReactNode } from 'react'

type MotionParagraphProps = Omit<ComponentProps<typeof motion.p>, 'children'> & {
  children?: ReactNode
}

type MotionHeadingProps = Omit<ComponentProps<typeof motion.h1>, 'children'> & {
  children?: ReactNode
}

export function StoryFrame({
  children,
  panelClassName,
}: {
  children: ReactNode
  panelClassName?: string
}) {
  return (
    <div className="relative isolate min-h-svh overflow-hidden bg-background/70">
      <div
        className={cn(
          'mx-auto min-h-svh w-full max-w-md border-x border-border/60 bg-card/80 shadow-2xl',
          panelClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function StoryKicker({
  className,
  ...props
}: MotionParagraphProps) {
  return (
    <motion.p
      className={cn(
        'w-fit rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary',
        className,
      )}
      {...props}
    />
  )
}

export function StoryEyebrow({
  className,
  ...props
}: MotionParagraphProps) {
  return (
    <motion.p
      className={cn(
        'mt-7 text-xs font-semibold uppercase tracking-widest text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

export function StoryHeading({
  accent,
  children,
  className,
  compact = false,
  ...props
}: MotionHeadingProps & {
  accent?: ReactNode
  compact?: boolean
}) {
  return (
    <motion.h1
      className={cn(
        'font-serif text-5xl leading-none tracking-normal text-foreground sm:text-6xl',
        compact ? 'mt-10' : 'mt-12',
        className,
      )}
      {...props}
    >
      {children}
      {accent ? <span className="block text-primary">{accent}</span> : null}
    </motion.h1>
  )
}

export function StoryCopy({
  className,
  wide = false,
  ...props
}: MotionParagraphProps & {
  wide?: boolean
}) {
  return (
    <motion.p
      className={cn(
        'mt-5 text-base leading-relaxed text-muted-foreground',
        wide ? 'max-w-sm' : 'max-w-xs',
        className,
      )}
      {...props}
    />
  )
}
