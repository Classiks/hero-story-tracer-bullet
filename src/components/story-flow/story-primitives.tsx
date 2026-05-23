import { cn } from '#/lib/utils'
import { motion } from 'framer-motion'

import type { ComponentProps, ReactNode } from 'react'

type MotionParagraphProps = Omit<ComponentProps<typeof motion.p>, 'children'> & {
  children?: ReactNode
}

type MotionHeadingProps = Omit<ComponentProps<typeof motion.h1>, 'children'> & {
  children?: ReactNode
}

type MotionDivProps = Omit<ComponentProps<typeof motion.div>, 'children'> & {
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
    <div className="relative isolate min-h-svh overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 -z-10',
          // Warm corner glow
          'bg-[radial-gradient(circle_at_22%_12%,color-mix(in_srgb,var(--primary)_28%,transparent),transparent_28%),radial-gradient(circle_at_82%_18%,color-mix(in_srgb,var(--accent)_18%,transparent),transparent_30%),linear-gradient(180deg,var(--background)_0%,var(--card)_48%,var(--background)_100%)]',
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 -z-10 opacity-80',
          // Magical light sweep
          'bg-[conic-gradient(from_215deg_at_50%_42%,transparent_0deg,color-mix(in_srgb,var(--accent)_13%,transparent)_55deg,transparent_118deg,color-mix(in_srgb,var(--primary)_18%,transparent)_186deg,transparent_275deg,transparent_360deg)]',
        )}
      />
      <div
        className={cn(
          'mx-auto min-h-svh w-full max-w-md',
          // Phone frame
          'border-x border-border/60 bg-card/85',
          // Glass depth
          'shadow-2xl shadow-background/70 backdrop-blur',
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
        'w-fit rounded-full px-3 py-1.5',
        'text-xs font-bold uppercase tracking-wider text-primary',
        // Badge tint
        'border border-primary/35 bg-primary/10',
        // Soft ember glow
        'shadow-[0_0_28px_color-mix(in_srgb,var(--primary)_20%,transparent)]',
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
  size = 'hero',
  ...props
}: MotionHeadingProps & {
  accent?: ReactNode
  compact?: boolean
  size?: 'hero' | 'page'
}) {
  return (
    <motion.h1
      className={cn(
        'font-serif leading-none tracking-normal text-foreground',
        size === 'hero' ? 'text-5xl sm:text-6xl' : 'text-3xl leading-tight sm:text-4xl',
        // Lift off background
        'drop-shadow-lg',
        compact ? (size === 'page' ? 'mt-6' : 'mt-10') : 'mt-12',
        className,
      )}
      {...props}
    >
      {children}
      {accent ? (
        <span
          className={cn(
            'block text-primary',
            // Accent glow
            'drop-shadow-[0_0_24px_color-mix(in_srgb,var(--primary)_45%,transparent)]',
          )}
        >
          {accent}
        </span>
      ) : null}
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

export function StorySurface({
  className,
  ...props
}: MotionDivProps) {
  return (
    <motion.div
      className={cn(
        'rounded-3xl',
        // Warm surface
        'border border-primary/15 bg-card/85',
        // Floating card
        'shadow-2xl shadow-background/60 backdrop-blur',
        className,
      )}
      {...props}
    />
  )
}

export function StoryLoadingEmblem({
  children,
  className,
  glow = true,
  ...props
}: MotionDivProps & {
  glow?: boolean
}) {
  return (
    <motion.div
      aria-hidden="true"
      className={cn(
        'mx-auto grid size-28 place-items-center rounded-full border border-accent/20 bg-accent/10 text-accent',
        glow && 'shadow-[0_0_42px_color-mix(in_srgb,var(--accent)_22%,transparent)]',
        className,
      )}
      animate={{ rotate: 360, scale: [1, 1.04, 1] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
