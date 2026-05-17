import { OnboardingShell } from '#/components/story-flow/onboarding-shell';
import { OnboardingStepForm } from '#/components/story-flow/onboarding-step-form';
import { StoryCopy, StoryHeading } from '#/components/story-flow/story-primitives';
import { useOnboardingStore } from '#/state/onboarding'
import { useShallow } from "zustand/react/shallow";
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Route as NextStepRoute } from "#/routes/story-flow/(onboarding)/goal";

export const Route = createFileRoute('/story-flow/(onboarding)/name')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  const [name, setName] = useOnboardingStore(useShallow(state => [state.name, state.setName]));

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
          helper="Every journey needs a name before it can answer back."
        />
      }
    >
      <StoryHeading
        accent="hero."
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
        Give the narrator a name to follow. The next step will turn that name
        toward a goal.
      </StoryCopy>
    </OnboardingShell>
  )
}
