import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { InputDepthMeter, type DepthMeterOptions } from '#/components/story-flow/input-depth-meter'
import { Textarea } from '#/components/ui/textarea'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'

import type { ReactNode } from 'react'

interface OnboardingStepFormProps {
  depthMeter?: DepthMeterOptions
  helper?: ReactNode
  inputLabel: string
  mode?: 'singleLine' | 'multiLine'
  placeholder: string
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
}

export function OnboardingStepForm({
  depthMeter,
  helper,
  inputLabel,
  mode = 'singleLine',
  placeholder,
  value,
  onChange,
  onSubmit,
}: OnboardingStepFormProps) {
  const canContinue = value.trim().length > 0

  const handleSubmit: React.ComponentProps<'form'>['onSubmit'] = (event) => {
    event.preventDefault()
    if (canContinue) {
      onSubmit()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-primary/20 bg-card/90 p-4 shadow-2xl shadow-background/50 backdrop-blur"
    >
      {mode === 'singleLine' ? (
        <div className="flex items-center gap-3">
          <Input
            aria-label={inputLabel}
            size="hero"
            variant="hero"
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
          <motion.div whileTap={{ scale: 0.94 }}>
            <Button
              aria-label="Continue"
              disabled={!canContinue}
              size="hero-icon"
              type="submit"
              variant="hero"
            >
              <Send />
            </Button>
          </motion.div>
        </div>
      ) : (
        <div>
          <Textarea
            aria-label={inputLabel}
            className="min-h-32 resize-none rounded-2xl border-primary/30 bg-background/75 px-4 py-3 text-base shadow-inner focus-visible:border-primary focus-visible:ring-primary/25"
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
          <InputDepthMeter options={depthMeter} value={value} />
          <motion.div className="mt-4" whileTap={{ scale: 0.98 }}>
            <Button
              aria-label="Continue"
              className="w-full"
              disabled={!canContinue}
              size="hero"
              type="submit"
              variant="hero"
            >
              Continue
              <Send />
            </Button>
          </motion.div>
        </div>
      )}

      {helper && (
        <p className="mt-3 border-l-2 border-accent/40 py-0.5 pl-3 text-sm leading-snug text-muted-foreground">
          {helper}
        </p>
      )}
    </form>
  )
}
