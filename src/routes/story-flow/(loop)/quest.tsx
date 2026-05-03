import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '#/components/ui/tooltip'
import { QuestQuestion, RecommendedTask, type IQuestQuestion, type IRecommendedTask, type IStoryBlueprint } from '#/modules/ai/schemas/metaphors'
import { useStoryBlueprintQuery } from '#/modules/story-flow/story-generation'
import { useOnboardingStore } from '#/state/onboarding'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CircleQuestionMark, Loader2, RefreshCw } from 'lucide-react'
import { Route as StartRoute } from '#/routes/story-flow/(onboarding)/name'

export const Route = createFileRoute('/story-flow/(loop)/quest')({
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

  const storyQuery = useStoryBlueprintQuery({ challenge, enabled: hasInputs, goal, name })
  const taskQuery = useRecommendedTaskQuery({
    challenge,
    enabled: hasInputs && Boolean(storyQuery.data),
    goal,
    name,
    storyBlueprint: storyQuery.data,
  })
  const questQuery = useQuestQuestionQuery({
    challenge,
    enabled: hasInputs && Boolean(storyQuery.data && taskQuery.data),
    goal,
    name,
    storyBlueprint: storyQuery.data,
    task: taskQuery.data,
    taskGeneratedAt: taskQuery.dataUpdatedAt,
  })

  if (!hasInputs) {
    return (
      <main className="min-h-svh p-6">
        <h1 className="text-2xl font-semibold">No quest yet</h1>
        <p className="mt-3 text-muted-foreground">
          Create your hero, goal, and challenge before asking for a quest.
        </p>
        <Button className="mt-6" onClick={() => navigate({ to: StartRoute.to })}>
          Start onboarding
        </Button>
      </main>
    )
  }

  const isLoading = storyQuery.isPending || taskQuery.isPending || questQuery.isPending
  const isRegeneratingQuest = questQuery.isRefetching
  const isRegeneratingTask = taskQuery.isRefetching
  const hasError = storyQuery.isError || taskQuery.isError || questQuery.isError
  const quest = questQuery.data

  return (
    <main className="min-h-svh p-6">
      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Preparing your next quest...
        </div>
      )}

      {hasError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="font-medium">The quest could not be generated.</p>
          <Button className="mt-4" onClick={() => void refetchFailedQueries({ questQuery, storyQuery, taskQuery })}>
            Try again
          </Button>
        </div>
      )}

      {quest && (
        <>
          <h1 className="text-2xl font-semibold">Your Quest: {quest.quest}</h1>
          <p className="mt-4 text-muted-foreground">{quest.content}</p>
          <p className="mt-4 font-medium">{quest.task}</p>

          <div className="mt-6 flex flex-row items-center gap-3">
            <Button>Accept</Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label="Generate a new quest"
                  disabled={isRegeneratingQuest}
                  onClick={() => void questQuery.refetch()}
                  size="icon"
                  variant="outline"
                >
                  <RefreshCw className={isRegeneratingQuest ? 'animate-spin' : undefined} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Generate a new quest</p>
              </TooltipContent>
            </Tooltip>

            <QuestReasonDialog
              isRegeneratingTask={isRegeneratingTask}
              onRegenerateTask={() => void taskQuery.refetch()}
              quest={quest}
              task={taskQuery.data}
            />
          </div>
        </>
      )}
    </main>
  )
}

function QuestReasonDialog({
  isRegeneratingTask,
  onRegenerateTask,
  quest,
  task,
}: {
  isRegeneratingTask: boolean
  onRegenerateTask: () => void
  quest: IQuestQuestion
  task: IRecommendedTask | undefined
}) {
  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button aria-label="Why this quest" size="icon" variant="outline">
              <CircleQuestionMark />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Why this quest</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Why this quest</DialogTitle>
          <DialogDescription>
            The hidden recommendation and story translation behind this quest.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <section>
            <h3 className="font-semibold text-foreground">Recommended Step</h3>
            <p className="mt-1 text-muted-foreground">{task?.task}</p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground">Why</h3>
            <p className="mt-1 text-muted-foreground">{task?.reasoning}</p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground">What is being translated</h3>
            <div className="mt-2 space-y-2">
              {quest.metaphors.map((metaphor) => (
                <p key={`${metaphor.real}:${metaphor.metaphor}`} className="text-muted-foreground">
                  <span className="font-medium text-foreground">{metaphor.real}</span>: {metaphor.metaphor}
                </p>
              ))}
            </div>
          </section>

          <Button disabled={isRegeneratingTask} onClick={onRegenerateTask} variant="outline">
            {isRegeneratingTask && <Loader2 className="animate-spin" />}
            Generate a new task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function useRecommendedTaskQuery({
  challenge,
  enabled,
  goal,
  name,
  storyBlueprint,
}: {
  challenge: string
  enabled: boolean
  goal: string
  name: string
  storyBlueprint: IStoryBlueprint | undefined
}) {
  return useQuery({
    enabled,
    queryKey: ['recommended-task', name, goal, challenge, storyBlueprint?.title],
    queryFn: async () => {
      if (!storyBlueprint) {
        throw new Error('Story blueprint is required')
      }

      const response = await fetch('/api/generate/data', {
        method: 'POST',
        body: JSON.stringify({
          message: createRecommendedTaskPrompt({ challenge, goal, name, storyBlueprint }),
          schemaId: 'recommendedTask',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate recommended task')
      }

      return RecommendedTask.parse(await response.json())
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity,
  })
}

function useQuestQuestionQuery({
  challenge,
  enabled,
  goal,
  name,
  storyBlueprint,
  task,
  taskGeneratedAt,
}: {
  challenge: string
  enabled: boolean
  goal: string
  name: string
  storyBlueprint: IStoryBlueprint | undefined
  task: IRecommendedTask | undefined
  taskGeneratedAt: number
}) {
  return useQuery({
    enabled,
    queryKey: ['quest-question', name, goal, challenge, storyBlueprint?.title, task?.task, taskGeneratedAt],
    queryFn: async () => {
      if (!storyBlueprint || !task) {
        throw new Error('Story blueprint and task are required')
      }

      const response = await fetch('/api/generate/data', {
        method: 'POST',
        body: JSON.stringify({
          message: createQuestQuestionPrompt({ challenge, goal, name, storyBlueprint, task }),
          schemaId: 'questQuestion',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate quest question')
      }

      return QuestQuestion.parse(await response.json())
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity,
  })
}

function createRecommendedTaskPrompt({
  challenge,
  goal,
  name,
  storyBlueprint,
}: {
  challenge: string
  goal: string
  name: string
  storyBlueprint: IStoryBlueprint
}) {
  return `
Choose one concrete next task for the user.

This result is hidden by default. It is used as reasoning input for a visible
story quest, so keep the task practical and directly useful.

User:
- Name: ${name}
- Goal: ${goal}
- Challenge: ${challenge}

Story context:
- Title: ${storyBlueprint.title}
- Blurb: ${storyBlueprint.storyBlurb}
- Hero: ${storyBlueprint.metaphors.hero}
- Challenge metaphor: ${storyBlueprint.metaphors.enemy}
- Reward: ${storyBlueprint.metaphors.reward}

Rules:
- Choose exactly one next step the user can take soon.
- Make it small enough to start without planning a whole project.
- The task must move the user toward the goal and account for the challenge.
- Do not invent personal history beyond the provided inputs.
- Reasoning should be concise and practical.
`
}

function createQuestQuestionPrompt({
  challenge,
  goal,
  name,
  storyBlueprint,
  task,
}: {
  challenge: string
  goal: string
  name: string
  storyBlueprint: IStoryBlueprint
  task: IRecommendedTask
}) {
  return `
Turn the recommended real-world task into a user-facing story quest.

The visible quest should feel like it belongs to the same story as the base
blurb. Do not expose the recommendation reasoning in the visible quest content.

User:
- Name: ${name}
- Goal: ${goal}
- Challenge: ${challenge}

Story context:
- Title: ${storyBlueprint.title}
- Blurb: ${storyBlueprint.storyBlurb}
- Hero: ${storyBlueprint.metaphors.hero}
- Challenge metaphor: ${storyBlueprint.metaphors.enemy}
- Reward: ${storyBlueprint.metaphors.reward}

Hidden recommended task:
- Task: ${task.task}
- Reasoning: ${task.reasoning}

Rules:
- quest: short story-world quest title.
- content: one vivid question or prompt that invites ${name} to act now.
- task: copy or lightly clarify the plain real-world task without fantasy language.
- metaphors: list the important real-world concepts and their story-world translations.
- Keep the story aligned with the base blurb; do not create a different world.
- The quest can vary its phrasing and metaphors even when the task stays the same.
`
}

async function refetchFailedQueries({
  questQuery,
  storyQuery,
  taskQuery,
}: {
  questQuery: ReturnType<typeof useQuestQuestionQuery>
  storyQuery: ReturnType<typeof useStoryBlueprintQuery>
  taskQuery: ReturnType<typeof useRecommendedTaskQuery>
}) {
  if (storyQuery.isError) {
    await storyQuery.refetch()
    return
  }

  if (taskQuery.isError) {
    await taskQuery.refetch()
    return
  }

  await questQuery.refetch()
}
