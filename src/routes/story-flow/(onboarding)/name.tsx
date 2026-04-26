import { OnboardingShell } from '#/components/story-flow/onboarding-shell';
import { OnboardingStepForm } from '#/components/story-flow/onboarding-step-form';
import { useOnboardingStore } from '#/state/onboarding'
import { useShallow } from "zustand/react/shallow";
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion';
import { Route as NextStepRoute } from "#/routes/story-flow/(onboarding)/goal";

export const Route = createFileRoute('/story-flow/(onboarding)/name')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  const [name, setName] = useOnboardingStore(useShallow(state => [state.name, state.setName]));
  const heroName = name.trim();

  return (
    <OnboardingShell
      chapter="Chapter 1"
      eyebrow="The chronicle wakes"
      action={
        <OnboardingStepForm
          inputLabel="Hero name"
          placeholder="Name the hero"
          value={name}
          onChange={setName}
          onSubmit={() => navigate({ to: NextStepRoute.to })}
          preview={
            heroName ? (
              <>
                The story now has a hero: <span className="text-cyan-200">{heroName}</span>.
              </>
            ) : (
              'Every journey needs a name before it can answer back.'
            )
          }
        />
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
