import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useOnboardingStore } from '#/state/onboarding';
import { useShallow } from 'zustand/react/shallow';
import { Input } from '#/components/ui/input';
import { Button } from '#/components/ui/button';
import { Send } from 'lucide-react';
import { Route as NextStepRoute } from "#/routes/story-flow/(onboarding)/story";

export const Route = createFileRoute('/story-flow/(onboarding)/problem')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  const [problem, setProblem] = useOnboardingStore(useShallow(state => [state.mainProblem, state.setMainProblem]));

  const handleSubmit: React.ComponentProps<'form'>['onSubmit'] = (event) => {
    event.preventDefault();
    navigate({ to: NextStepRoute.to });
  };

  return <div>
    <div>Input Problem</div>
    <div>{problem}</div>
    <form onSubmit={handleSubmit} className="flex flex-row gap-3 px-10">
      <Input
        autoFocus
        value={problem}
        onChange={(e) => setProblem(e.target.value)}
      />
      <Button type="submit">
        <Send />
      </Button>
    </form>
  </div>
}
