import { Button } from '#/components/ui/button'
import { StoryCopy, StoryFrame, StoryHeading, StoryKicker, StorySurface } from '#/components/story-flow/story-primitives'
import { StoryBlueprint, type IStoryBlueprint } from '#/modules/ai/schemas/metaphors'
import { useOnboardingStore } from '#/state/onboarding'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Crown, Flame, Gem, ImageIcon, ShieldAlert } from 'lucide-react'
import { useEffect } from 'react'
import { Route as NameRoute } from "#/routes/story-flow/(onboarding)/name";

export const Route = createFileRoute('/story-flow/(onboarding)/story')({
  component: RouteComponent,
})

const playedLevelUpKeys = new Set<string>()

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
  const storyBlueprint = storyQuery.data
  const imageQuery = useStoryImageQuery(storyBlueprint)

  useEffect(() => {
    if (!storyBlueprint) {
      return
    }

    const audioKey = [
      name,
      goal,
      challenge,
      storyBlueprint.title,
    ].join('|')

    if (playedLevelUpKeys.has(audioKey)) {
      return
    }

    playedLevelUpKeys.add(audioKey)
    void new Audio('/assets/sounds/levelup.mp3').play().catch(() => undefined)
  }, [challenge, goal, name, storyBlueprint])

  if (!hasInputs) {
    return (
      <StoryFrame>
        <div className="flex min-h-svh flex-col justify-between px-5 py-6">
          <div>
            <StoryKicker>Chronicle paused</StoryKicker>
            <StoryHeading accent="pieces.">
              Missing
            </StoryHeading>
            <StoryCopy>
              The story needs a hero, a quest, and a challenge before it can
              shape the journey.
            </StoryCopy>
          </div>

          <Button
            onClick={() => navigate({ to: NameRoute.to })}
            size="hero"
            variant="hero"
          >
            <ArrowLeft />
            Start again
          </Button>
        </div>
      </StoryFrame>
    )
  }

  return (
    <StoryFrame>
      <main className="min-h-svh px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36 }}
        >
          <StoryKicker>Story blueprint</StoryKicker>

          {storyQuery.isPending && <StoryLoading name={name} />}

          {storyQuery.isError && (
            <ErrorState message="The chronicle failed to form. Step back and try the story again later." />
          )}

          {storyBlueprint && (
            <StoryPresentation
              blueprint={storyBlueprint}
              imageData={imageQuery.data}
              imageError={imageQuery.isError}
              imagePending={imageQuery.isPending}
            />
          )}
        </motion.div>
      </main>
    </StoryFrame>
  )
}

function StoryLoading({ name }: { name: string }) {
  return (
    <div className="mt-12">
      <motion.div
        aria-hidden="true"
        className="mx-auto size-28 rounded-full border border-accent/20 bg-accent/10"
        animate={{ rotate: 360, scale: [1, 1.04, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      />
      <StoryHeading accent="the chronicle." compact>
        Forging
      </StoryHeading>
      <StoryCopy wide>
        The narrator is turning {name} into a hero, the goal into a quest, and
        the challenge into something that can be faced.
      </StoryCopy>
    </div>
  )
}

function StoryPresentation({
  blueprint,
  imageData,
  imageError,
  imagePending,
}: {
  blueprint: IStoryBlueprint
  imageData: string | undefined
  imageError: boolean
  imagePending: boolean
}) {
  return (
    <div className="mt-10 pb-5">
      <StoryImageBanner
        imageData={imageData}
        imageError={imageError}
        imagePending={imagePending}
        title={blueprint.title}
      />

      <StoryHeading
        className="mt-7"
        compact
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {blueprint.title}
      </StoryHeading>

      <StoryCopy
        className="max-w-none text-foreground/80"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        {blueprint.storyBlurb}
      </StoryCopy>

      <div className="mt-5 grid gap-3">
        <MetaphorCard
          icon={<Crown className="size-5" />}
          label="Hero"
          value={blueprint.metaphors.hero}
        />
        <MetaphorCard
          icon={<ShieldAlert className="size-5" />}
          label="Challenge"
          value={blueprint.metaphors.enemy}
        />
        <MetaphorCard
          icon={<Gem className="size-5" />}
          label="Reward"
          value={blueprint.metaphors.reward}
        />
      </div>

      <Button className="mt-10 w-full" disabled={!imageData} onClick={() => alert("Mehr gibts noch nicht :)")} size="hero" variant="hero">
        Continue <ArrowRight />
      </Button>
    </div>
  )
}

function StoryImageBanner({
  imageData,
  imageError,
  imagePending,
  title,
}: {
  imageData: string | undefined
  imageError: boolean
  imagePending: boolean
  title: string
}) {
  return (
    <StorySurface
      className="-mx-2 overflow-hidden bg-background/65"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {imagePending && (
        <div className="flex aspect-video flex-col items-center justify-center gap-4 px-8 text-center text-muted-foreground">
          <motion.div
            animate={{ opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            <ImageIcon className="size-9 text-accent" />
          </motion.div>
          <p>The banner is taking shape.</p>
        </div>
      )}

      {imageError && (
        <div className="flex aspect-video flex-col items-center justify-center gap-4 px-8 text-center text-muted-foreground">
          <Flame className="size-9 text-primary" />
          <p>The story is ready, but the banner could not be forged.</p>
        </div>
      )}

      {imageData && (
        <img
          alt={title}
          className="aspect-video w-full bg-background object-contain"
          src={`data:image/png;base64,${imageData}`}
        />
      )}
    </StorySurface>
  )
}

function MetaphorCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <StorySurface
      className="flex items-center gap-3 rounded-2xl p-4"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="grid size-10 place-items-center rounded-xl bg-accent/10 text-accent">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
      </div>
    </StorySurface>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="mt-12 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-foreground">
      {message}
    </div>
  )
}

function useStoryBlueprintQuery({
  challenge,
  enabled,
  goal,
  name,
}: {
  challenge: string
  enabled: boolean
  goal: string
  name: string
}) {
  return useQuery({
    enabled,
    queryKey: ['story-blueprint', name, goal, challenge],
    queryFn: async () => {
      const response = await fetch("/api/generate/data", {
        method: "POST",
        body: JSON.stringify({
          message: createStoryBlueprintPrompt({ challenge, goal, name }),
          schemaId: "storyBlueprint"
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate story blueprint')
      }

      return StoryBlueprint.parse(await response.json());
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity,
  })
}

function useStoryImageQuery(blueprint: IStoryBlueprint | undefined) {
  const imageKey = blueprint
    ? [
      blueprint.title,
      blueprint.metaphors.hero,
      blueprint.metaphors.enemy,
      blueprint.metaphors.reward,
    ].join('|')
    : ''

  return useQuery({
    enabled: Boolean(blueprint),
    queryKey: ['story-image', imageKey],
    queryFn: async () => {
      if (!blueprint) {
        throw new Error('Story blueprint is required')
      }

      const response = await fetch("/api/generate/image", {
        method: "POST",
        body: JSON.stringify({
          message: createStoryImagePrompt(blueprint),
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate story image')
      }

      const content = await response.json();
      return content.image as string;
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity,
  })
}

function createStoryBlueprintPrompt({
  challenge,
  goal,
  name,
}: {
  challenge: string
  goal: string
  name: string
}) {
  return `
Create a motivational hero-story blueprint for a task-support app.

The output will be shown directly to the user on a mobile screen. Make it vivid,
specific, and energizing without sounding like generic fantasy lore.

User:
- Name: ${name}
- Goal: ${goal}
- Challenge: ${challenge}

Rules:
- Address the user by name in the story blurb.
- Keep the title short and punchy.
- The metaphors must connect clearly to the actual goal and challenge.
- The enemy metaphor should make the challenge feel faceable, not hopeless.
- The reward metaphor should feel emotionally meaningful, not just material.
- The call to action should be one short sentence.
`;
}

function createStoryImagePrompt(blueprint: IStoryBlueprint) {
  return `
Create a wide 16:9 heroic fantasy banner illustration for this motivational story.

Title: ${blueprint.title}
Story: ${blueprint.storyBlurb}
Hero metaphor: ${blueprint.metaphors.hero}
Challenge metaphor: ${blueprint.metaphors.enemy}
Reward metaphor: ${blueprint.metaphors.reward}

Composition:
- Wide banner framing, strong central silhouette, readable on a phone.
- The hero should be moving toward or facing the challenge.
- Include a visual hint of the reward without cluttering the image.
- Cartoonish pixel-art inspired illustration with chunky shapes, clean silhouettes,
  simplified details, and warm storybook charm.
- Use a painterly pixel aesthetic, like a handcrafted animated short still, not a
  screenshot from a video game.
- Bright, adventurous lighting with clear color contrast, not dark or muddy.
- No text, no captions, no UI, no menus, no buttons, no icons, no health bars, no
  mana bars, no stats, no inventory, no minimap, no game HUD.
`;
}
