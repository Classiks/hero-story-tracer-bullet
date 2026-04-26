import { motion } from 'framer-motion'

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
    <main className="relative isolate grid min-h-svh items-stretch overflow-hidden bg-[radial-gradient(circle_at_22%_12%,rgba(255,122,61,0.28),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(84,227,208,0.16),transparent_30%),linear-gradient(180deg,#070910_0%,#0d1422_46%,#05070c_100%)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[conic-gradient(from_215deg_at_50%_42%,transparent_0deg,rgba(84,227,208,0.12)_55deg,transparent_118deg,rgba(255,122,61,0.16)_186deg,transparent_275deg,transparent_360deg),radial-gradient(circle_at_50%_42%,rgba(255,183,74,0.12),transparent_44%)] opacity-70"
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[11%] h-44 w-44 -translate-x-1/2 rounded-full border border-cyan-200/10"
        animate={{ rotate: 360, scale: [1, 1.06, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />

      <motion.section
        className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col justify-between gap-6 overflow-hidden border-x border-white/10 bg-[linear-gradient(180deg,rgba(16,24,39,0.78),rgba(5,7,12,0.92)),linear-gradient(135deg,rgba(255,183,74,0.1),transparent_42%)] px-5 py-6 shadow-[0_18px_60px_rgba(0,0,0,0.44)]"
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
          <motion.div
            className="w-fit rounded-full border border-[#ffb74a]/30 bg-[#ffb74a]/10 px-3 py-1.5 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#ffb74a]"
            variants={appear}
          >
            {chapter}
          </motion.div>
          <motion.p
            className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/65"
            variants={appear}
          >
            {eyebrow}
          </motion.p>
          {children}
        </div>

        <motion.div
          variants={appear}
          transition={{ type: 'spring', stiffness: 150, damping: 18 }}
        >
          {action}
        </motion.div>
      </motion.section>
    </main>
  )
}
