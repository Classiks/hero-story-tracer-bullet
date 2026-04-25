import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { useUserStore } from '#/state/user'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Send } from 'lucide-react';
import { Route as NextStepRoute } from "#/routes/story-flow/(onboarding)/problem";

export const Route = createFileRoute('/story-flow/(onboarding)/name')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  const { name, setName } = useUserStore();

  const handleSubmit: React.ComponentProps<'form'>['onSubmit'] = (event) => {
    event.preventDefault();
    navigate({ to: NextStepRoute.to });
  };

  return <div>
    <div>{name}</div>
    <form onSubmit={handleSubmit} className="flex flex-row gap-3 px-10">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button type="submit">
        <Send />
      </Button>
    </form>
  </div>
}
