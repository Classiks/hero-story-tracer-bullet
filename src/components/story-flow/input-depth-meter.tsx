import { cn } from '#/lib/utils'

export type DepthMeterOptions = {
  targetLength: number
  minHelpfulLength?: number
  label?: string
  completeLabel?: string
}

export function InputDepthMeter({
  className,
  options,
  value,
}: {
  className?: string
  options?: DepthMeterOptions
  value: string
}) {
  if (!options) {
    return null
  }

  const length = value.trim().length
  const progress = Math.min(length / options.targetLength, 1)
  const minHelpfulLength = options.minHelpfulLength ?? Math.round(options.targetLength * 0.45)
  const isHelpful = length >= minHelpfulLength
  const isComplete = progress >= 1
  const label = isComplete
    ? (options.completeLabel ?? 'Rich detail')
    : isHelpful
      ? (options.label ?? 'Good detail')
      : 'A little more detail helps'
  const hue = Math.round(42 + progress * 98)

  return (
    <div className={cn('mt-3', className)}>
      <div className="h-2 overflow-hidden rounded-full bg-background/75 ring-1 ring-border/60">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            backgroundColor: `hsl(${hue} 72% 48%)`,
            width: `${Math.max(progress * 100, length ? 8 : 0)}%`,
          }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-3 text-[0.68rem] font-semibold uppercase tracking-widest text-muted-foreground">
        <span>{label}</span>
        <span>{Math.min(length, options.targetLength)}/{options.targetLength}</span>
      </div>
    </div>
  )
}
