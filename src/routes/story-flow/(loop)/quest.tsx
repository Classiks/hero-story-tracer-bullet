import { Button } from '#/components/ui/button'
import {
  StoryCopy,
  StoryFrame,
  StoryHeading,
  StoryKicker,
  StorySurface,
} from '#/components/story-flow/story-primitives'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '#/components/ui/tooltip'
import {
  Quest,
  RecommendedTask,
  type IQuest,
  type IRecommendedTask,
  type IStoryBlueprint,
} from '#/modules/ai/schemas/metaphors'
import { useStoryBlueprintQuery } from '#/modules/story-flow/story-generation'
import { useOnboardingStore } from '#/state/onboarding'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Check,
  CircleQuestionMark,
  Loader2,
  RefreshCw,
  ScrollText,
  Sparkles,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
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
  const questQuery = useQuestQuery({
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
      <StoryFrame>
        <div className="flex min-h-svh flex-col justify-between px-5 py-6">
          <div>
            <StoryKicker>Chronicle paused</StoryKicker>
            <StoryHeading accent="quest.">Missing</StoryHeading>
            <StoryCopy>
              The story needs a hero, a quest, and a challenge before it can
              shape the next step.
            </StoryCopy>
          </div>

          <Button
            onClick={() => navigate({ to: StartRoute.to })}
            size="hero"
            variant="hero"
          >
            <ArrowLeft />
            Start onboarding
          </Button>
        </div>
      </StoryFrame>
    )
  }

  const isLoading = storyQuery.isPending || taskQuery.isPending || questQuery.isPending
  const isRegeneratingQuest = questQuery.isRefetching
  const isRegeneratingTask = taskQuery.isRefetching
  const hasError = storyQuery.isError || taskQuery.isError || questQuery.isError
  const quest = questQuery.data

  return (
    <StoryFrame>
      <main className="min-h-svh px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36 }}
        >
          <StoryKicker>Active quest</StoryKicker>

          {isLoading && <QuestLoading name={name} />}

          {hasError && (
            <QuestErrorState
              onRetry={() => void refetchFailedQueries({ questQuery, storyQuery, taskQuery })}
            />
          )}

          {quest && (
            <QuestPresentation
              isRegeneratingQuest={isRegeneratingQuest}
              isRegeneratingTask={isRegeneratingTask}
              onRegenerateQuest={() => void questQuery.refetch()}
              onRegenerateTask={() => void taskQuery.refetch()}
              quest={quest}
              task={taskQuery.data}
            />
          )}
        </motion.div>
      </main>
    </StoryFrame>
  )
}

function QuestLoading({ name }: { name: string }) {
  return (
    <div className="mt-12">
      <motion.div
        aria-hidden="true"
        className="mx-auto grid size-28 place-items-center rounded-full border border-accent/20 bg-accent/10 text-accent"
        animate={{ rotate: 360, scale: [1, 1.04, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      >
        <ScrollText className="size-9" />
      </motion.div>
      <StoryHeading accent="quest." compact>
        Preparing
      </StoryHeading>
      <StoryCopy wide>
        The narrator is reading the path ahead for {name} and shaping one step
        into a quest worth answering.
      </StoryCopy>
    </div>
  )
}

function QuestErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <StorySurface className="mt-12 p-5">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
          <Sparkles className="size-5" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">The quest failed to form.</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Step back into the story and ask the narrator to try again.
          </p>
        </div>
      </div>

      <Button className="mt-5 w-full" onClick={onRetry} size="hero" variant="hero">
        Try again
      </Button>
    </StorySurface>
  )
}

function QuestPresentation({
  isRegeneratingQuest,
  isRegeneratingTask,
  onRegenerateQuest,
  onRegenerateTask,
  quest,
  task,
}: {
  isRegeneratingQuest: boolean
  isRegeneratingTask: boolean
  onRegenerateQuest: () => void
  onRegenerateTask: () => void
  quest: IQuest
  task: IRecommendedTask | undefined
}) {
  function handleAcceptQuest() {
    void new Audio('/assets/sounds/quest-accepted.mp3').play().catch(() => undefined)
    alert('not yet implemented :)')
  }

  return (
    <div className="mt-10 pb-5">
      <StoryHeading
        className="mt-7"
        compact
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {quest.quest}
      </StoryHeading>

      <StorySurface
        className="mt-6 p-5"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
      >
        <p className="text-base leading-relaxed text-foreground/85">{quest.content}</p>
      </StorySurface>

      <StorySurface
        className="mt-4 border-accent/25 bg-accent/10 p-5"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Action
        </p>
        <p className="mt-3 text-lg font-semibold leading-snug text-foreground">
          {quest.action}
        </p>
      </StorySurface>

      <div className="mt-6 flex items-center gap-3">
        <Button className="flex-1" onClick={handleAcceptQuest} size="hero" variant="hero">
          <Check />
          Accept
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Generate a new quest"
              disabled={isRegeneratingQuest}
              onClick={onRegenerateQuest}
              size="hero-icon"
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
          onRegenerateTask={onRegenerateTask}
          quest={quest}
          task={task}
        />
      </div>
    </div>
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
  quest: IQuest
  task: IRecommendedTask | undefined
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button aria-label="Why this quest" size="hero-icon" variant="outline">
              <CircleQuestionMark />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Why this quest</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Why this quest</DialogTitle>
          <DialogDescription>
            The hidden recommendation and story translation behind this quest.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <section className="rounded-2xl border border-border bg-card/60 p-4">
            <h3 className="font-semibold text-foreground">Recommended step</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">{task?.task}</p>
          </section>

          <section className="rounded-2xl border border-border bg-card/60 p-4">
            <h3 className="font-semibold text-foreground">Why</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">{task?.reasoning}</p>
          </section>

          <section className="rounded-2xl border border-border bg-card/60 p-4">
            <h3 className="font-semibold text-foreground">What is being translated</h3>
            <div className="mt-3 space-y-3">
              {quest.metaphors.map((metaphor) => (
                <div key={`${metaphor.real}:${metaphor.metaphor}`} className="space-y-1">
                  <p className="font-medium leading-snug text-foreground">{metaphor.real}</p>
                  <p className="leading-relaxed text-muted-foreground">{metaphor.metaphor}</p>
                </div>
              ))}
            </div>
          </section>

          <Button
            className="w-full"
            disabled={isRegeneratingTask}
            onClick={onRegenerateTask}
            size="hero"
            variant="outline"
          >
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
    placeholderData: (previousData) => previousData,
    retry: false,
    staleTime: Infinity,
  })
}

function useQuestQuery({
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
    queryKey: ['quest', name, goal, challenge, storyBlueprint?.title, task?.task, taskGeneratedAt],
    queryFn: async () => {
      if (!storyBlueprint || !task) {
        throw new Error('Story blueprint and task are required')
      }

      const response = await fetch('/api/generate/data', {
        method: 'POST',
        body: JSON.stringify({
          message: createQuestPrompt({ challenge, goal, name, storyBlueprint, task }),
          schemaId: 'quest',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate quest')
      }

      return Quest.parse(await response.json())
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
- The task must be complete, concrete, and immediately understandable.
- The task must include all needed details; never output a sentence fragment.
- The task must move the user toward the goal and account for the challenge.
- Do not invent personal history beyond the provided inputs.
- Reasoning should be concise and practical.
- Avoid vague branded ritual names unless they make the action clearer.
`
}

function createQuestPrompt({
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

This is the primary motivational moment in the app. The quest should make the
user feel identified with the hero and ready to act now.

The quest and content fields must live inside the story world. They should feel
like a compact World of Warcraft or Guild Wars 2 quest brief: a small story with
situation, pressure, immediate action, and emotional payoff. Do not expose the
recommendation reasoning or literal real-world task details in the visible quest
content.

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
- quest: short in-world quest title. Do not use literal productivity terms.
- content: 3-5 sentences of immersive in-world quest text.
- content must establish the immediate story situation, name the pressure or threat, call the hero into action, and show what this small action changes.
- action: short, direct in-world instruction the hero should take now.
- action must be actionable while staying fully inside the story metaphor.
- metaphors: list the important real-world concepts and their story-world translations for the explanation dialog.
- The first metaphors item must map the complete real-world recommended task to the generated in-world action.
- Keep the story aligned with the base blurb; do not create a different world.
- The quest can vary its phrasing and metaphors even when the task stays the same.
- The metaphor must sharpen the real task, not hide it behind vague fantasy.
- Keep concrete real-world details out of quest, content, and action unless those exact words already belong to the story world.
- Banned from quest/content/action when they break immersion: coding, calendar, app, 25 minutes, distractions, task, schedule.
- Use in-world equivalents: timebox -> one focused watch or short vigil; project work -> shaping the relic, forgework, artifact; distraction -> whispers, fog, lures; procrastination or inertia -> the existing enemy pressing closer.
- Avoid arbitrary ritual titles, "begin the journey" phrasing, and incomplete task strings.
- Bad title: "Iron Will's 25-Minute Code Strike"
- Bad content: "Spend 25 minutes coding on your app, ignoring all distractions."
- Bad action: "Spend 25 minutes coding on your app, ignoring all distractions."
- Good title: "The First Strike at Dawn"
- Good content: "Iron Will, the forge has cooled beneath the Great Sloth's mist, but one coal still glows under the ash. The beast fattens on every unguarded hour, and its whispers grow louder when the hammer stays still. Take up the work for one focused watch and shape the relic one clean strike further. Let the fog learn that even a small flame can push it back."
- Good action: "Hold the forge for one focused watch, shaping the relic while the Sloth's whispers pass unanswered."
`
}

async function refetchFailedQueries({
  questQuery,
  storyQuery,
  taskQuery,
}: {
  questQuery: ReturnType<typeof useQuestQuery>
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
