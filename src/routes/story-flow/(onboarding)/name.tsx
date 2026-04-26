import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { OnboardingShell } from '#/components/story-flow/onboarding-shell';
import { useOnboardingStore } from '#/state/onboarding'
import { useShallow } from "zustand/react/shallow";
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { Route as NextStepRoute } from "#/routes/story-flow/(onboarding)/goal";

export const Route = createFileRoute('/story-flow/(onboarding)/name')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  const [name, setName] = useOnboardingStore(useShallow(state => [state.name, state.setName]));
  const heroName = name.trim();
  const canContinue = heroName.length > 0;

  const handleSubmit: React.ComponentProps<'form'>['onSubmit'] = (event) => {
    event.preventDefault();
    if (!canContinue) {
      return;
    }

    navigate({ to: NextStepRoute.to });
  };

  return (
    <OnboardingShell
      chapter="Chapter 1"
      eyebrow="The chronicle wakes"
      action={
        <form
          onSubmit={handleSubmit}
          className="rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(247,240,223,0.08),rgba(247,240,223,0.035)),rgba(5,7,12,0.5)] p-3.5 shadow-[0_14px_32px_rgba(0,0,0,0.24)] backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <Input
              aria-label="Hero name"
              autoFocus
              className="h-14 rounded-2xl border-[#ffb74a]/30 bg-[#05070c]/65 px-4 text-base text-[#f7f0df] shadow-[0_0_0_1px_rgba(84,227,208,0.04)_inset] placeholder:text-[#b5ae9d]/60 focus-visible:border-[#ffb74a] focus-visible:ring-[#ffb74a]/20"
              placeholder="Name the hero"
              value={name}
              onChange={(e) => setName(e.target.value)}
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

          <motion.p
            className="mt-3 min-h-11 border-l-2 border-cyan-200/35 py-0.5 pl-3 text-[0.92rem] leading-snug text-[#f7f0df]"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
          >
            {heroName ? (
              <>
                The story now has a hero: <span className="text-cyan-200">{heroName}</span>.
              </>
            ) : (
              'Every journey needs a name before it can answer back.'
            )}
          </motion.p>
        </form>
      }
    >
      <motion.h1
        className="mt-12 font-serif text-[clamp(2.45rem,15vw,4.2rem)] leading-[0.92] tracking-normal text-[#f7f0df]"
        variants={{
          hidden: { opacity: 0, y: 24 },
          show: { opacity: 1, y: 0 },
        }}
      >
        Name the
        <span className="block text-[#ffb74a] [text-shadow:0_0_26px_rgba(255,122,61,0.38)]">hero.</span>
      </motion.h1>

      <motion.p
        className="mt-5 max-w-[29ch] text-base leading-relaxed text-[#b5ae9d]"
        variants={{
          hidden: { opacity: 0, y: 18 },
          show: { opacity: 1, y: 0 },
        }}
      >
        Give the narrator a name to follow. The next step will turn that name
        toward a goal.
      </motion.p>
    </OnboardingShell>
  )
}
