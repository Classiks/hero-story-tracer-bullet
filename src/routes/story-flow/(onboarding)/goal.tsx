import { OnboardingShell } from '#/components/story-flow/onboarding-shell';
import { OnboardingStepForm } from '#/components/story-flow/onboarding-step-form';
import { StoryCopy, StoryHeading } from '#/components/story-flow/story-primitives';
import { useOnboardingStore } from '#/state/onboarding'
import { useShallow } from "zustand/react/shallow";
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Route as NextStepRoute } from "#/routes/story-flow/(onboarding)/problem";

export const Route = createFileRoute('/story-flow/(onboarding)/goal')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  const [goal, setGoal] = useOnboardingStore(useShallow(state => [state.goal, state.setGoal]));

  return (
    <OnboardingShell
      chapter="Chapter 2"
      eyebrow="Choose the summit"
      action={
        <OnboardingStepForm
          inputLabel="Goal"
          placeholder="What are you trying to achieve?"
          mode="multiLine"
          depthMeter={{
            targetLength: 140,
            minHelpfulLength: 60,
            label: 'Useful direction',
            completeLabel: 'Strong direction',
          }}
          value={goal}
          onChange={setGoal}
          onSubmit={() => navigate({ to: NextStepRoute.to })}
          helper="A clear destination helps the narrator choose quests that fit your real life."
        />
      }
    >
      <StoryHeading
        accent="quest."
        variants={{
          hidden: { opacity: 0, y: 24 },
          show: { opacity: 1, y: 0 },
        }}
      >
        Name the
      </StoryHeading>

      <StoryCopy
        variants={{
          hidden: { opacity: 0, y: 18 },
          show: { opacity: 1, y: 0 },
        }}
      >
        Say what you want to make real. The narration needs a clear destination
        before it can raise the stakes.
      </StoryCopy>
    </OnboardingShell>
  )
}
