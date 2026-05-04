import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '#/components/ui/accordion'
import { Button } from '#/components/ui/button'
import { Textarea } from '#/components/ui/textarea'
import { useStoryBlueprintQuery } from '#/modules/story-flow/onboarding'
import { useQuestQuery, useRecommendedTaskQuery } from '#/modules/story-flow/quest'
import { useOnboardingStore } from '#/state/onboarding'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Route as NextRoute } from "#/routes/story-flow/(loop)/quest/result";
import { useState } from 'react'

export const Route = createFileRoute('/story-flow/(loop)/quest/feedback')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

  const rawName = useOnboardingStore((state) => state.name)
  const rawGoal = useOnboardingStore((state) => state.goal)
  const rawChallenge = useOnboardingStore((state) => state.mainProblem)

  const name = rawName.trim()
  const goal = rawGoal.trim()
  const challenge = rawChallenge.trim()
  const hasInputs = Boolean(name && goal && challenge)

  const [note, setNote] = useState<string | undefined>()

  const storyQuery = useStoryBlueprintQuery({ challenge, enabled: hasInputs, goal, name })
  const taskQuery = useRecommendedTaskQuery({
    challenge,
    enabled: hasInputs && Boolean(storyQuery.data),
    goal,
    name,
    storyBlueprint: storyQuery.data,
  })
  const questQuery = useQuestQuery({
    challenge,
    enabled: hasInputs && Boolean(storyQuery.data && taskQuery.data),
    goal,
    name,
    storyBlueprint: storyQuery.data,
    task: taskQuery.data,
    taskGeneratedAt: taskQuery.dataUpdatedAt,
  })

  if (!questQuery.data) {
    return;
  }

  return <div>
    <h1>{questQuery.data.quest}</h1>
    <Accordion type="single">
      <AccordionItem value="quest text">
        <AccordionTrigger>Quest Text</AccordionTrigger>
        <AccordionContent>{questQuery.data.content}</AccordionContent>
      </AccordionItem>
    </Accordion>

    <div className="flex">
      <Button onClick={() => navigate({ to: NextRoute.to, search: { success: true, note } })}>
        Complete
      </Button>
      <Button onClick={() => navigate({ to: NextRoute.to, search: { success: false, note } })}>
        Abandon
      </Button>
    </div>

    <h2>Notes</h2>
    <Textarea placeholder="optional remarks" value={note} onChange={e => setNote(e.target.value)} />
  </div>
}
