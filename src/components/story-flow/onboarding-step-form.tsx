import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'

import type { ReactNode } from 'react'

interface OnboardingStepFormProps {
  inputLabel: string
  placeholder: string
  preview: ReactNode
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
}

export function OnboardingStepForm({
  inputLabel,
  placeholder,
  preview,
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
      className="rounded-2xl border border-primary/20 bg-card/90 p-3.5 shadow-2xl shadow-background/50 backdrop-blur"
    >
      <div className="flex items-center gap-3">
        <Input
          aria-label={inputLabel}
          autoFocus
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

      <p className="mt-3 min-h-11 border-l-2 border-accent/40 py-0.5 pl-3 text-sm leading-snug text-foreground">
        {preview}
      </p>
    </form>
  )
}
