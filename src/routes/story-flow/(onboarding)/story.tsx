import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton';
import { Metaphors, type IMetaphors } from '#/modules/ai/schemas/metaphors';
import { useOnboardingStore } from '#/state/onboarding'
import { useMutation } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/story-flow/(onboarding)/story')({
  component: RouteComponent,
})

function RouteComponent() {
  const { name, goal, mainProblem: problem } = useOnboardingStore();

  const generationMutation = useGenerateMutation();
  const imageMutation = useImageMutation(generationMutation.data);

  return <div>
    <p>Name: {name}</p>
    <p>Goal: {goal}</p>
    <p>Problem: {problem}</p>

    <div className="py-10" />

    <Button onClick={() => generationMutation.mutate()}>
      Generate Metaphors
    </Button>

    <div className="py-10" />

    {generationMutation.isPending && <Skeleton className="size-20 bg-black" />}

    <pre>{JSON.stringify(generationMutation.data)}</pre>

    <Button onClick={() => imageMutation.mutate()}>
      Generate Image
    </Button>

    <div className="py-10" />

    {imageMutation.isPending && <Skeleton className="size-20 bg-black" />}

    <img src={`data:image/png;base64,${imageMutation.data}`} />

  </div>
}

function useGenerateMutation() {
  const { name, goal, mainProblem: problem } = useOnboardingStore();

  const prompt = `
Your goal is to create metaphors for a hero story. 
What you generate will be the foundation of a motivation heros journey for the user.

Here are the information:

Name: ${name}
Goal: ${goal}
Problem: ${problem}
`;

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/generate/data", {
        method: "POST",
        body: JSON.stringify({
          message: prompt,
          schemaId: "metaphors"
        })
      });

      const parsed = Metaphors.parse(await response.json());
      return parsed;
    }
  })
}

function useImageMutation(metaphors: IMetaphors | undefined) {
  return useMutation({
    mutationFn: async () => {
      if (!metaphors) {
        return;
      }

      const prompt = `
Generate an image that depicts the hero ${metaphors.hero} overcoming ${metaphors.enemy} to gain ${metaphors.reward}.
Style: Cartoony, almost pixel Art.
`;
      const response = await fetch("/api/generate/image", {
        method: "POST",
        body: JSON.stringify({
          message: prompt,
        })
      });

      const content = await response.json();
      return content.image as string;
    }
  })
}
