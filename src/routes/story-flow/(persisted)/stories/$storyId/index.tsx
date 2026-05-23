import { Button } from '#/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '#/components/ui/accordion'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import {
  StoryCopy,
  StoryFrame,
  StoryHeading,
  StorySurface,
} from '#/components/story-flow/story-primitives'
import { StoryRouteHeader } from '#/components/story-flow/story-route-header'
import {
  useDeleteStoryMutation,
  useStorySessionQuery,
  useUpdateStoryStatusMutation,
} from '#/modules/story-flow/story-api-client'
import type {
  PersistedQuest,
  PersistedStory,
  StoryProgress,
  StoryStatus,
} from '#/modules/story-flow/persisted-types'
import { createFileRoute } from '@tanstack/react-router'
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ImageIcon,
  Loader2,
  MoreHorizontal,
  RotateCcw,
  ScrollText,
  Trash2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Route as LandingRoute } from '#/routes/story-flow/index'

export const Route = createFileRoute('/story-flow/(persisted)/stories/$storyId/')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const { storyId } = Route.useParams()
  const sessionQuery = useStorySessionQuery(storyId)
  const session = sessionQuery.data
  const storyIsActive = session?.story.status === 'active'

  return (
    <StoryFrame>
      <main className="min-h-svh px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36 }}
        >
          <StoryRouteHeader
            actions={session ? <StoryLifecycleMenu story={session.story} /> : undefined}
          >
            Story progress
          </StoryRouteHeader>

          {sessionQuery.isPending && <HubLoading />}

          {sessionQuery.isError && (
            <StorySurface className="mt-12 p-5">
              <h1 className="font-semibold text-foreground">The story could not be loaded.</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Go back to your stories or try opening this one again later.
              </p>
              <Button
                className="mt-5 w-full"
                onClick={() => navigate({ to: LandingRoute.to })}
                size="hero"
                variant="hero"
              >
                <ArrowLeft />
                Back to stories
              </Button>
            </StorySurface>
          )}

          {session && (
            <div className="mt-10 pb-5">
              <StoryHeading compact>{session.story.blueprint.title}</StoryHeading>
              <StoryHeroImage story={session.story} />
              <StoryBlurbDialog story={session.story} />

              {storyIsActive ? (
                <Button
                  className="mt-6 w-full"
                  onClick={() => {
                    if (
                      session.progress.nextAction === 'finish_accepted_quest' &&
                      session.progress.currentQuest
                    ) {
                      void navigate({
                        params: { questId: session.progress.currentQuest.id, storyId },
                        to: '/story-flow/stories/$storyId/quest/$questId/feedback',
                      })
                      return
                    }

                    void navigate({
                      params: { storyId },
                      to: '/story-flow/stories/$storyId/quest/proposal',
                    })
                  }}
                  size="hero"
                  variant="hero"
                >
                  {getNextActionLabel(session.progress.nextAction)}
                  <ArrowRight />
                </Button>
              ) : (
                <StorySurface className="mt-6 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    This story is archived.
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Restore it to active if you want to continue adding quests.
                  </p>
                </StorySurface>
              )}

              <StorySoFar
                nextAction={session.progress.nextAction}
                storyBeats={session.storyBeats}
              />
            </div>
          )}
        </motion.div>
      </main>
    </StoryFrame>
  )
}

function HubLoading() {
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
      <StoryHeading accent="path." compact>
        Reading
      </StoryHeading>
      <StoryCopy wide>The narrator is opening the current story path.</StoryCopy>
    </div>
  )
}

function StoryHeroImage({ story }: { story: PersistedStory }) {
  return (
    <StorySurface
      className="mt-6 overflow-hidden rounded-2xl border-2 border-foreground/20 bg-background shadow-[6px_6px_0_color-mix(in_srgb,var(--foreground)_12%,transparent)]"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {story.storyImageUrl ? (
        <img
          alt={story.blueprint.title}
          className="aspect-[4/3] w-full bg-background object-cover"
          src={story.storyImageUrl}
        />
      ) : (
        <div className="grid aspect-[4/3] place-items-center bg-[radial-gradient(circle_at_30%_20%,color-mix(in_srgb,var(--accent)_20%,transparent),transparent_34%),linear-gradient(135deg,var(--card),var(--background))] px-8 text-center">
          <div>
            <ImageIcon className="mx-auto size-9 text-accent" />
            <p className="mt-4 font-serif text-3xl leading-none text-foreground">
              {story.blueprint.title}
            </p>
          </div>
        </div>
      )}
    </StorySurface>
  )
}

function StoryBlurbDialog({ story }: { story: PersistedStory }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="mt-4 px-0" size="sm" variant="link">
          Read story setup
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{story.blueprint.title}</DialogTitle>
          <DialogDescription>Story setup</DialogDescription>
        </DialogHeader>

        {story.storyImageUrl && (
          <img
            alt={story.blueprint.title}
            className="aspect-video w-full rounded-lg border border-border bg-background object-contain"
            src={story.storyImageUrl}
          />
        )}

        <div className="space-y-4 text-sm leading-relaxed text-foreground/85">
          {story.blueprint.storyBlurb
            .split(/\n+/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StoryLifecycleMenu({ story }: { story: PersistedStory }) {
  const navigate = Route.useNavigate()
  const updateStatus = useUpdateStoryStatusMutation()
  const deleteStory = useDeleteStoryMutation()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const isBusy = updateStatus.isPending || deleteStory.isPending
  const storyIsActive = story.status === 'active'
  const errorMessage = updateStatus.isError
    ? 'The story status could not be updated. Try again.'
    : deleteStory.isError
      ? 'The story could not be deleted. Try again.'
      : null

  function updateStoryStatus(status: StoryStatus) {
    updateStatus.mutate({ status, storyId: story.id })
  }

  return (
    <div className="relative flex shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="Story actions"
            disabled={isBusy}
            size="icon-sm"
            variant="outline"
          >
            {isBusy ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {storyIsActive ? (
            <DropdownMenuItem
              disabled={updateStatus.isPending}
              onSelect={() => updateStoryStatus('archived')}
            >
              <Archive />
              Archive story
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={updateStatus.isPending}
              onSelect={() => updateStoryStatus('active')}
            >
              <RotateCcw />
              Restore story
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={deleteStory.isPending}
            onSelect={() => setDeleteDialogOpen(true)}
            variant="destructive"
          >
            <Trash2 />
            Delete story
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteStoryDialog
        isDeleting={deleteStory.isPending}
        onDelete={() => {
          deleteStory.mutate(story.id, {
            onSuccess: () => {
              void navigate({ to: LandingRoute.to })
            },
          })
        }}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        storyTitle={story.blueprint.title}
      />

      {errorMessage && (
        <p className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-destructive/30 bg-popover p-3 text-right text-sm text-foreground shadow-md">
          {errorMessage}
        </p>
      )}
    </div>
  )
}

function DeleteStoryDialog({
  isDeleting,
  onDelete,
  onOpenChange,
  open,
  storyTitle,
}: {
  isDeleting: boolean
  onDelete: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
  storyTitle: string
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this story?</DialogTitle>
          <DialogDescription>
            This permanently deletes {storyTitle}, including its quests and generated images.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Keep story
            </Button>
          </DialogClose>
          <Button disabled={isDeleting} onClick={onDelete} type="button" variant="destructive">
            {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
            Delete permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
function StorySoFar({
  nextAction,
  storyBeats,
}: {
  nextAction: StoryProgress['nextAction']
  storyBeats: PersistedQuest[]
}) {
  return (
    <section className="mt-9">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Story so far
      </h2>

      {storyBeats.length ? (
        <div className="mt-4 grid gap-5">
          {storyBeats.map((quest, index) => (
            <StoryComicPanel key={quest.id} pageNumber={index + 1} quest={quest} />
          ))}
        </div>
      ) : (
        <EmptyComicState nextAction={nextAction} />
      )}
    </section>
  )
}

function StoryComicPanel({
  pageNumber,
  quest,
}: {
  pageNumber: number
  quest: PersistedQuest
}) {
  const result = quest.resultText

  if (!result) {
    return null
  }

  return (
    <StorySurface
      className="overflow-hidden rounded-2xl border-2 border-foreground/20 bg-background shadow-[6px_6px_0_color-mix(in_srgb,var(--foreground)_12%,transparent)]"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="border-b-2 border-foreground/15 bg-card">
        {quest.resultImageUrl ? (
          <img
            alt={result.title}
            className="aspect-[4/3] w-full bg-background object-cover"
            src={quest.resultImageUrl}
          />
        ) : (
          <div className="grid aspect-[4/3] place-items-center bg-[radial-gradient(circle_at_30%_20%,color-mix(in_srgb,var(--accent)_20%,transparent),transparent_34%),linear-gradient(135deg,var(--card),var(--background))] px-8 text-center">
            <div>
              <ImageIcon className="mx-auto size-9 text-accent" />
              <p className="mt-4 font-serif text-3xl leading-none text-foreground">
                {result.title}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-widest text-primary">
            Page {pageNumber}
          </p>
          <p className="rounded-full border border-border bg-card px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground">
            {getStatusLabel(quest.status)}
          </p>
        </div>

        <h3 className="mt-3 text-lg font-black leading-tight text-foreground">
          {result.title}
        </h3>
        <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-foreground/80">
          {result.text}
        </p>
        <ComicPageDialog pageNumber={pageNumber} quest={quest} />
      </div>
    </StorySurface>
  )
}

function ComicPageDialog({
  pageNumber,
  quest,
}: {
  pageNumber: number
  quest: PersistedQuest
}) {
  const result = quest.resultText

  if (!result) {
    return null
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="mt-4 px-0" size="sm" variant="link">
          Read page
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{result.title}</DialogTitle>
          <DialogDescription>
            Page {pageNumber} · {getOutcomeContextLabel(quest)}
          </DialogDescription>
        </DialogHeader>

        {quest.resultImageUrl && (
          <img
            alt={result.title}
            className="aspect-video w-full rounded-lg border border-border bg-background object-contain"
            src={quest.resultImageUrl}
          />
        )}

        <div className="space-y-4 text-sm leading-relaxed text-foreground/85">
          {result.text
            .split(/\n+/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
        </div>

        <Accordion className="rounded-2xl border border-border bg-card/60 px-4" collapsible type="single">
          <AccordionItem value="quest-context">
            <AccordionTrigger>Quest context</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 text-sm">
                <ContextDetail label="Outcome" value={getOutcomeContextLabel(quest)} />
                <ContextDetail label="Real-world step" value={quest.recommendedTask.task} />
                <ContextDetail label="Quest" value={quest.quest.quest} />
                <ContextDetail label="In-story action" value={quest.quest.action} />
                <ContextDetail
                  label="Feedback"
                  value={quest.feedback.note?.trim() || 'No note was added.'}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DialogContent>
    </Dialog>
  )
}

function ContextDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 leading-relaxed text-foreground/85">{value}</p>
    </div>
  )
}

function EmptyComicState({ nextAction }: { nextAction: StoryProgress['nextAction'] }) {
  return (
    <StorySurface className="mt-4 p-5">
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent">
          <BookOpen className="size-5" />
        </div>
        <div>
          <h2 className="font-semibold leading-tight text-foreground">No pages yet</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {getEmptyComicCopy(nextAction)}
          </p>
        </div>
      </div>
    </StorySurface>
  )
}

function getNextActionLabel(action: StoryProgress['nextAction']) {
  switch (action) {
    case 'finish_accepted_quest':
      return 'Finish quest'
    case 'get_next_quest':
      return 'Get next quest'
    case 'review_proposal':
      return 'Review quest'
    case 'start_first_quest':
      return 'Start first quest'
  }
}

function getEmptyComicCopy(action: StoryProgress['nextAction']) {
  switch (action) {
    case 'finish_accepted_quest':
      return 'Finish the active quest to turn this part of the journey into the first comic page.'
    case 'get_next_quest':
      return 'The next recorded quest will become the first page in this story.'
    case 'review_proposal':
      return 'Review the waiting quest, then record its outcome to start the comic.'
    case 'start_first_quest':
      return 'Start the first quest. Completed moments will collect here as illustrated story pages.'
  }
}

function getStatusLabel(status: PersistedQuest['status']) {
  switch (status) {
    case 'accepted':
      return 'accepted'
    case 'completed':
      return 'completed'
    case 'proposed':
      return 'proposed'
    case 'rejected':
      return 'rejected'
    case 'unresolved':
      return 'unresolved'
  }
}

function getOutcomeContextLabel(quest: PersistedQuest) {
  switch (quest.outcomeStatus) {
    case 'completed':
      return 'Successful'
    case 'rejected':
      return 'Rejected'
    case 'unresolved':
      return 'Unresolved'
    case null:
      return getStatusLabel(quest.status)
  }
}
