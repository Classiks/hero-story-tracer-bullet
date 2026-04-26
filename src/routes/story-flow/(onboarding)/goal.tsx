import { OnboardingShell } from '#/components/story-flow/onboarding-shell';
import { OnboardingStepForm } from '#/components/story-flow/onboarding-step-form';
import { useOnboardingStore } from '#/state/onboarding'
import { useShallow } from "zustand/react/shallow";
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion';
import { Route as NextStepRoute } from "#/routes/story-flow/(onboarding)/problem";

export const Route = createFileRoute('/story-flow/(onboarding)/goal')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  const [goal, setGoal] = useOnboardingStore(useShallow(state => [state.goal, state.setGoal]));
  const focusedGoal = goal.trim();

  return (
    <OnboardingShell
      chapter="Chapter 2"
      eyebrow="Choose the summit"
      action={
        <OnboardingStepForm
          inputLabel="Goal"
          placeholder="What are you trying to achieve?"
          value={goal}
          onChange={setGoal}
          onSubmit={() => navigate({ to: NextStepRoute.to })}
          preview={
            focusedGoal ? (
              <>
                The path points toward: <span className="text-cyan-200">{focusedGoal}</span>.
              </>
            ) : (
              'A hero needs a destination before the road can appear.'
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
        <span className="block text-[#ffb74a] [text-shadow:0_0_26px_rgba(255,122,61,0.38)]">quest.</span>
      </motion.h1>

      <motion.p
        className="mt-5 max-w-[29ch] text-base leading-relaxed text-[#b5ae9d]"
        variants={{
          hidden: { opacity: 0, y: 18 },
          show: { opacity: 1, y: 0 },
        }}
      >
        Say what you want to make real. The narration needs a clear destination
        before it can raise the stakes.
      </motion.p>
    </OnboardingShell>
  )
}
