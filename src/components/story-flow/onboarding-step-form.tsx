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
      className="rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(247,240,223,0.08),rgba(247,240,223,0.035)),rgba(5,7,12,0.5)] p-3.5 shadow-[0_14px_32px_rgba(0,0,0,0.24)] backdrop-blur-xl"
    >
      <div className="flex items-center gap-3">
        <Input
          aria-label={inputLabel}
          autoFocus
          className="h-14 rounded-2xl border-[#ffb74a]/30 bg-[#05070c]/65 px-4 text-base text-[#f7f0df] shadow-[0_0_0_1px_rgba(84,227,208,0.04)_inset] placeholder:text-[#b5ae9d]/60 focus-visible:border-[#ffb74a] focus-visible:ring-[#ffb74a]/20"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <motion.div whileTap={{ scale: 0.94 }}>
          <Button
            aria-label="Continue"
            className="h-14 min-w-14 rounded-2xl bg-[linear-gradient(135deg,#ffb74a,#ff7a3d)] text-[#160f08] shadow-[0_10px_26px_rgba(255,122,61,0.26),0_1px_0_rgba(255,255,255,0.34)_inset] hover:bg-[linear-gradient(135deg,#ffc768,#ff854c)] disabled:bg-white/10 disabled:text-[#f7f0df]/45 disabled:shadow-none"
            disabled={!canContinue}
            size="icon"
            type="submit"
          >
            <Send />
          </Button>
        </motion.div>
      </div>

      <p className="mt-3 min-h-11 border-l-2 border-cyan-200/35 py-0.5 pl-3 text-[0.92rem] leading-snug text-[#f7f0df]">
        {preview}
      </p>
    </form>
  )
}
