import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '#/components/ui/accordion'
import { Button } from '#/components/ui/button'
import {
  StoryCopy,
  StoryFrame,
  StoryHeading,
  StoryLoadingEmblem,
  StorySurface,
} from '#/components/story-flow/story-primitives'
import { StoryRouteHeader } from '#/components/story-flow/story-route-header'
import { GeneratedImagePlaceholder } from '#/components/story-flow/generated-image-placeholder'
import { questOutcomeSucceeded, type QuestOutcomeStatus } from '#/modules/story-flow/quest-outcome'
import { useGenerateQuestResultImageMutation, useQuestQuery } from '#/modules/story-flow/story-api-client'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, Award, CircleSlash, ScrollText, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { Route as LandingRoute } from '#/routes/story-flow/index'
import { Route as StoryHubRoute } from '#/routes/story-flow/(persisted)/stories/$storyId'
import { Route as NextRoute } from '#/routes/story-flow/(persisted)/stories/$storyId/quest/proposal'

export const Route = createFileRoute('/story-flow/(persisted)/stories/$storyId/quest/$questId/result')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { questId, storyId } = Route.useParams()
  const questQuery = useQuestQuery(questId)
  const quest = questQuery.data?.quest
  const outcomeStatus = quest?.outcomeStatus
  const outcomeSucceeded = outcomeStatus ? questOutcomeSucceeded(outcomeStatus) : false
  const note = quest?.feedback.note?.trim()
  const generateResultImage = useGenerateQuestResultImageMutation(questId)
  const imageMissing = Boolean(quest?.resultText && !quest.resultImageUrl)
  const { isError: imageError, isIdle: imageIdle, mutate: generateImage } = generateResultImage

  useEffect(() => {
    if (imageMissing && imageIdle) {
      generateImage()
    }
  }, [generateImage, imageIdle, imageMissing])

  return (
    <StoryFrame>
      <main className="min-h-svh px-5 py-6">
        <StoryRouteHeader>{outcomeSucceeded ? 'Quest complete' : 'Quest unresolved'}</StoryRouteHeader>

        {questQuery.isPending && <QuestResultLoading outcomeStatus={outcomeStatus ?? 'unresolved'} />}

        {questQuery.isError && (
          <StorySurface className="mt-12 p-5">
            <h1 className="font-semibold text-foreground">The result could not be loaded.</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Step back into the story and try again.
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

        {quest && !quest.resultText && (
          <StorySurface className="mt-12 p-5">
            <h1 className="font-semibold text-foreground">The result is not written yet.</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Return to the quest feedback and mark the outcome first.
            </p>
          </StorySurface>
        )}

        {quest?.resultText && outcomeStatus && (
          <motion.div
            className="mt-10 pb-5"
            initial={{ opacity: 0, y: outcomeSucceeded ? 22 : 14, scale: outcomeSucceeded ? 0.98 : 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: outcomeSucceeded ? 0.48 : 0.36, ease: 'easeOut' }}
          >
            <ResultStatusCard outcomeStatus={outcomeStatus} />

            <QuestResultImage
              imageError={imageError}
              imageUrl={quest.resultImageUrl}
              title={quest.resultText.title}
            />

            <StoryHeading className="mt-7" compact size="page">{quest.resultText.title}</StoryHeading>

            <StorySurface
              className="mt-6 p-5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              <div className="space-y-4">
                {quest.resultText.text
                  .split('\n')
                  .filter(Boolean)
                  .map((paragraph) => (
                    <p key={paragraph} className="leading-relaxed text-foreground/85">
                      {paragraph}
                    </p>
                  ))}
              </div>
            </StorySurface>

            {note && <FeedbackNote note={note} />}

            <Button
              className="mt-8 w-full"
              onClick={() =>
                navigate({
                  params: { storyId },
                  to: NextRoute.to,
                })
              }
              size="hero"
              variant="hero"
            >
              Onto the next quest
              <ArrowRight />
            </Button>

            <Button
              className="mt-3 w-full"
              onClick={() =>
                navigate({
                  params: { storyId },
                  to: StoryHubRoute.to,
                })
              }
              size="hero"
              variant="outline"
            >
              Story progress
            </Button>
          </motion.div>
        )}
      </main>
    </StoryFrame>
  )
}

function QuestResultLoading({ outcomeStatus }: { outcomeStatus: QuestOutcomeStatus }) {
  const success = questOutcomeSucceeded(outcomeStatus)

  return (
    <div className="mt-12">
      <StoryLoadingEmblem>
        <ScrollText className="size-9" />
      </StoryLoadingEmblem>
      <motion.div
        className="mt-7 flex justify-center"
        animate={{ opacity: [0.45, 1, 0.45] }}
        transition={{ duration: 1.7, repeat: Infinity }}
      >
        <Sparkles className="size-5 text-primary" />
      </motion.div>
      <StoryHeading accent="chronicle." compact size="page">
        Writing
      </StoryHeading>
      <StoryCopy wide>
        {success
          ? 'The narrator is shaping your completed quest into a bright mark in the chronicle.'
          : 'The narrator is shaping this unresolved quest into a steady path forward.'}
      </StoryCopy>
    </div>
  )
}

function ResultStatusCard({ outcomeStatus }: { outcomeStatus: QuestOutcomeStatus }) {
  const success = questOutcomeSucceeded(outcomeStatus)
  const Icon = success ? Award : CircleSlash

  return (
    <StorySurface
      className={
        success
          ? 'mb-5 border-accent/30 bg-accent/10 p-5 shadow-[0_0_46px_color-mix(in_srgb,var(--accent)_18%,transparent)]'
          : 'mb-5 border-primary/20 bg-primary/5 p-5'
      }
      initial={{ opacity: 0, y: 12, scale: success ? 0.96 : 1 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        boxShadow: success
          ? [
            '0 0 0 color-mix(in_srgb,var(--accent)_0%,transparent)',
            '0 0 46px color-mix(in_srgb,var(--accent)_18%,transparent)',
            '0 0 24px color-mix(in_srgb,var(--accent)_10%,transparent)',
          ]
          : undefined,
      }}
      transition={{ duration: success ? 0.7 : 0.4, ease: 'easeOut' }}
    >
      <div className="flex items-start gap-3">
        <motion.div
          className={
            success
              ? 'grid size-12 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent'
              : 'grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary'
          }
          animate={success ? { scale: [1, 1.12, 1], rotate: [0, -4, 4, 0] } : undefined}
          transition={success ? { duration: 0.62, delay: 0.16 } : undefined}
        >
          <Icon className="size-6" />
        </motion.div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Outcome
          </p>
          <h2 className="mt-2 text-xl font-semibold leading-tight text-foreground">
            {success ? 'Quest completed' : 'Quest unresolved'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {success
              ? 'The story has a new mark of progress. Read what changed, then choose the next quest.'
              : 'This was not a victory lap. The story is still moving, and the next quest can begin from here.'}
          </p>
        </div>
      </div>
    </StorySurface>
  )
}

function FeedbackNote({ note }: { note: string }) {
  return (
    <StorySurface className="mt-4 p-5">
      <Accordion type="single" collapsible>
        <AccordionItem value="feedback-note">
          <AccordionTrigger>Feedback note used by the narrator</AccordionTrigger>
          <AccordionContent>
            <p className="leading-relaxed text-muted-foreground">{note}</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </StorySurface>
  )
}

function QuestResultImage({
  imageError,
  imageUrl,
  title,
}: {
  imageError: boolean
  imageUrl: string | null
  title: string
}) {
  return (
    <StorySurface
      className="-mx-2 overflow-hidden bg-background/65"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
    >
      {!imageUrl && (
        <GeneratedImagePlaceholder error={imageError} />
      )}

      {imageUrl && (
        <img
          alt={title}
          className="aspect-video w-full bg-background object-contain"
          src={imageUrl}
        />
      )}
    </StorySurface>
  )
}
