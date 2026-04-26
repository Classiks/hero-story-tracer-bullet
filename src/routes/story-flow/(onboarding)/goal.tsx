import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { useOnboardingStore } from '#/state/onboarding'
import { useShallow } from "zustand/react/shallow";
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Send } from 'lucide-react';
import { Route as NextStepRoute } from "#/routes/story-flow/(onboarding)/problem";

export const Route = createFileRoute('/story-flow/(onboarding)/goal')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  const [goal, setGoal] = useOnboardingStore(useShallow(state => [state.goal, state.setGoal]));

  const handleSubmit: React.ComponentProps<'form'>['onSubmit'] = (event) => {
    event.preventDefault();
    navigate({ to: NextStepRoute.to });
  };

  return <div>
    <div>Input Goal</div>
    <div>{goal}</div>
    <form onSubmit={handleSubmit} className="flex flex-row gap-3 px-10">
      <Input
        autoFocus
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
      />
      <Button type="submit">
        <Send />
      </Button>
    </form>
  </div>
}
