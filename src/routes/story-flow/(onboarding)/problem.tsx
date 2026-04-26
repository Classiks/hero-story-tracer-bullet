import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useOnboardingStore } from '#/state/onboarding';
import { useShallow } from 'zustand/react/shallow';
import { OnboardingShell } from '#/components/story-flow/onboarding-shell';
import { OnboardingStepForm } from '#/components/story-flow/onboarding-step-form';
import { motion } from 'framer-motion';
import { Route as NextStepRoute } from "#/routes/story-flow/(onboarding)/story";

export const Route = createFileRoute('/story-flow/(onboarding)/problem')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  const [challenge, setChallenge] = useOnboardingStore(useShallow(state => [state.mainProblem, state.setMainProblem]));
  const focusedChallenge = challenge.trim();

  return (
    <OnboardingShell
      chapter="Chapter 3"
      eyebrow="Face the challenge"
      action={
        <OnboardingStepForm
          inputLabel="Challenge"
          placeholder="What stands in the way?"
          value={challenge}
          onChange={setChallenge}
          onSubmit={() => navigate({ to: NextStepRoute.to })}
          preview={
            focusedChallenge ? (
              <>
                The opposition takes shape: <span className="text-cyan-200">{focusedChallenge}</span>.
              </>
            ) : (
              'The story gets stronger when the challenge has a name.'
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
        Mark the
        <span className="block text-[#ffb74a] [text-shadow:0_0_26px_rgba(255,122,61,0.38)]">trial.</span>
      </motion.h1>

      <motion.p
        className="mt-5 max-w-[29ch] text-base leading-relaxed text-[#b5ae9d]"
        variants={{
          hidden: { opacity: 0, y: 18 },
          show: { opacity: 1, y: 0 },
        }}
      >
        What makes this hard right now? Give the story something honest to push
        against.
      </motion.p>
    </OnboardingShell>
  )
}
