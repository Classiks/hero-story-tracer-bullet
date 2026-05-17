import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useOnboardingStore } from '#/state/onboarding';
import { useShallow } from 'zustand/react/shallow';
import { OnboardingShell } from '#/components/story-flow/onboarding-shell';
import { OnboardingStepForm } from '#/components/story-flow/onboarding-step-form';
import { StoryCopy, StoryHeading } from '#/components/story-flow/story-primitives';
import { Route as NextStepRoute } from "#/routes/story-flow/(onboarding)/blurb";

export const Route = createFileRoute('/story-flow/(onboarding)/problem')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  const [challenge, setChallenge] = useOnboardingStore(useShallow(state => [state.mainProblem, state.setMainProblem]));

  return (
    <OnboardingShell
      chapter="Chapter 3"
      eyebrow="Face the challenge"
      action={
        <OnboardingStepForm
          inputLabel="Challenge"
          placeholder="What stands in the way?"
          mode="multiLine"
          depthMeter={{
            targetLength: 140,
            minHelpfulLength: 60,
            label: 'Useful context',
            completeLabel: 'Strong context',
          }}
          value={challenge}
          onChange={setChallenge}
          onSubmit={() => navigate({ to: NextStepRoute.to })}
          helper="The story gets stronger when it knows what makes this hard right now."
        />
      }
    >
      <StoryHeading
        accent="trial."
        variants={{
          hidden: { opacity: 0, y: 24 },
          show: { opacity: 1, y: 0 },
        }}
      >
        Mark the
      </StoryHeading>

      <StoryCopy
        variants={{
          hidden: { opacity: 0, y: 18 },
          show: { opacity: 1, y: 0 },
        }}
      >
        What makes this hard right now? Give the story something honest to push
        against.
      </StoryCopy>
    </OnboardingShell>
  )
}
