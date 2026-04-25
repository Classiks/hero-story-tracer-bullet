import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useProblemStore } from '#/state/problem'; import { Input } from '#/components/ui/input';
import { Button } from '#/components/ui/button';
import { Send } from 'lucide-react';
import { Route as NextStepRoute } from "#/routes/story-flow/(onboarding)/story";

export const Route = createFileRoute('/story-flow/(onboarding)/problem')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  const { mainProblem, setMainProblem } = useProblemStore();

  const handleSubmit: React.ComponentProps<'form'>['onSubmit'] = (event) => {
    event.preventDefault();
    navigate({ to: NextStepRoute.to });
  };

  return <div>
    <div>{mainProblem}</div>
    <form onSubmit={handleSubmit} className="flex flex-row gap-3 px-10">
      <Input
        value={mainProblem}
        onChange={(e) => setMainProblem(e.target.value)}
      />
      <Button type="submit">
        <Send />
      </Button>
    </form>
  </div>
}
