import type { Json } from '#/lib/database.types'
import type { createServerSupabaseClient } from '#/lib/supabase-server'
import { generateData } from '#/modules/ai/generate-data'
import { generateImage } from '#/modules/ai/generate-image'
import { readMockData, readMockImage, shouldMock } from '#/modules/ai/mock-mode'
import {
  Quest,
  QuestResultText,
  RecommendedTask,
  StoryBlueprint,
  type IQuest,
  type IQuestResultText,
  type IRecommendedTask,
  type IStoryBlueprint,
} from '#/modules/ai/schemas/metaphors'
import {
  createQuestPrompt,
  createQuestResultImagePrompt,
  createQuestResultTextPrompt,
  createRecommendedTaskPrompt,
  createStoryBlueprintPrompt,
  createStoryImagePrompt,
} from '#/modules/story-flow/prompts'
import type { QuestFeedback, QuestOutcomeStatus } from '#/modules/story-flow/quest-outcome'
import type {
  PersistedQuest,
  PersistedStory,
  QuestStatus,
  StoryProgress,
  StoryStatus,
} from '#/modules/story-flow/persisted-types'

const GENERATED_ASSETS_BUCKET = 'generated-assets'
const SIGNED_URL_TTL_SECONDS = 60 * 60
const ACTIVE_STORY_STATUS: StoryStatus = 'active'
const AI_GENERATION_LOCK_MS = 2 * 60 * 1000
const AI_GENERATION_POLL_INTERVAL_MS = 500
const AI_GENERATION_POLL_TIMEOUT_MS = 2 * 60 * 1000

type ServerSupabase = ReturnType<typeof createServerSupabaseClient>
type AiGenerationKind =
  | 'story_blueprint'
  | 'quest_proposal'
  | 'quest_result_text'
  | 'story_image'
  | 'quest_result_image'
type AiGenerationRow = {
  error: string | null
  id: string
  key: string
  kind: AiGenerationKind
  locked_until: string
  result_quest_id: string | null
  result_story_id: string | null
  status: 'running' | 'completed' | 'failed'
  user_id: string
}
type AiGenerationResult<T> = {
  result: T
  resultQuestId?: string | null
  resultStoryId?: string | null
}

export class StoryServiceError extends Error {
  constructor(
    message: string,
    public status = 500,
  ) {
    super(message)
  }
}

async function runAiGenerationOnce<T>({
  key,
  kind,
  resolveExisting,
  run,
  supabase,
  userId,
}: {
  key: string
  kind: AiGenerationKind
  resolveExisting: (row: AiGenerationRow) => Promise<T | null>
  run: () => Promise<AiGenerationResult<T>>
  supabase: ServerSupabase
  userId: string
}): Promise<T> {
  const lockUntil = getAiGenerationLockUntil()
  const { data: insertedRow, error: insertError } = await supabase
    .from('ai_generations')
    .insert({
      key,
      kind,
      locked_until: lockUntil,
      status: 'running',
      user_id: userId,
    })
    .select()
    .single()

  if (!insertError && insertedRow) {
    return completeOwnedAiGeneration({
      row: insertedRow,
      run,
      supabase,
    })
  }

  if (insertError?.code !== '23505') {
    throw new StoryServiceError(insertError?.message ?? 'AI generation lock failed.')
  }

  return await resolveOrClaimExistingAiGeneration({
    key,
    kind,
    resolveExisting,
    run,
    supabase,
    userId,
  })
}

async function completeOwnedAiGeneration<T>({
  row,
  run,
  supabase,
}: {
  row: AiGenerationRow
  run: () => Promise<AiGenerationResult<T>>
  supabase: ServerSupabase
}) {
  try {
    const output = await run()
    const { error: updateError } = await supabase
      .from('ai_generations')
      .update({
        error: null,
        result_quest_id: output.resultQuestId ?? null,
        result_story_id: output.resultStoryId ?? null,
        status: 'completed',
      })
      .eq('id', row.id)

    if (updateError) {
      throw new StoryServiceError(updateError.message)
    }

    return output.result
  } catch (error) {
    await supabase
      .from('ai_generations')
      .update({
        error: error instanceof Error ? error.message : 'AI generation failed.',
        locked_until: new Date().toISOString(),
        status: 'failed',
      })
      .eq('id', row.id)

    throw error
  }
}

async function resolveOrClaimExistingAiGeneration<T>({
  key,
  kind,
  resolveExisting,
  run,
  supabase,
  userId,
}: {
  key: string
  kind: AiGenerationKind
  resolveExisting: (row: AiGenerationRow) => Promise<T | null>
  run: () => Promise<AiGenerationResult<T>>
  supabase: ServerSupabase
  userId: string
}) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < AI_GENERATION_POLL_TIMEOUT_MS) {
    const row = await getAiGenerationRow({ key, supabase, userId })

    if (!row) {
      await sleep(AI_GENERATION_POLL_INTERVAL_MS)
      continue
    }

    if (row.kind !== kind) {
      throw new StoryServiceError('AI generation key was reused for a different operation.', 409)
    }

    if (row.status === 'completed') {
      const existing = await resolveExisting(row)
      if (existing) {
        return existing
      }
    }

    if (row.status === 'failed' || new Date(row.locked_until).getTime() <= Date.now()) {
      const claimedRow = await claimAiGenerationRow({ row, supabase })
      if (claimedRow) {
        return completeOwnedAiGeneration({
          row: claimedRow,
          run,
          supabase,
        })
      }
    }

    await sleep(AI_GENERATION_POLL_INTERVAL_MS)
  }

  throw new StoryServiceError('AI generation is already in progress. Try again shortly.', 409)
}

async function getAiGenerationRow({
  key,
  supabase,
  userId,
}: {
  key: string
  supabase: ServerSupabase
  userId: string
}) {
  const { data, error } = await supabase
    .from('ai_generations')
    .select()
    .eq('user_id', userId)
    .eq('key', key)
    .maybeSingle()

  if (error) {
    throw new StoryServiceError(error.message)
  }

  return data
}

async function claimAiGenerationRow({
  row,
  supabase,
}: {
  row: AiGenerationRow
  supabase: ServerSupabase
}) {
  const query = supabase
    .from('ai_generations')
    .update({
      error: null,
      locked_until: getAiGenerationLockUntil(),
      status: 'running',
    })
    .eq('id', row.id)
    .select()

  const { data, error } =
    row.status === 'failed'
      ? await query.eq('status', 'failed').maybeSingle()
      : await query.lt('locked_until', new Date().toISOString()).maybeSingle()

  if (error) {
    throw new StoryServiceError(error.message)
  }

  return data
}

function getAiGenerationLockUntil() {
  return new Date(Date.now() + AI_GENERATION_LOCK_MS).toISOString()
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function createPersistedStory({
  challenge,
  clientRequestId,
  goal,
  name,
  supabase,
  userId,
}: {
  challenge: string
  clientRequestId: string
  goal: string
  name: string
  supabase: ServerSupabase
  userId: string
}) {
  return runAiGenerationOnce({
    key: `story:create:${clientRequestId}`,
    kind: 'story_blueprint',
    resolveExisting: async (row) => {
      if (!row.result_story_id) {
        return null
      }

      return getPersistedStory({ storyId: row.result_story_id, supabase })
    },
    run: async () => {
      const storyId = crypto.randomUUID()
      const priorStoryContext = await getPriorStoryContext({ supabase, userId })
      const blueprint = await generateStoryBlueprint({
        challenge,
        goal,
        name,
        priorStoryContext,
      })

      const { data: storyRow, error: insertStoryError } = await supabase
        .from('stories')
        .insert({
          id: storyId,
          user_id: userId,
          name,
          goal,
          challenge,
          status: 'active',
          blueprint: blueprint as unknown as Json,
        })
        .select()
        .single()

      if (insertStoryError) {
        throw new StoryServiceError(insertStoryError.message)
      }

      return {
        result: await toStoryResponse({ row: storyRow, supabase }),
        resultStoryId: storyId,
      }
    },
    supabase,
    userId,
  })
}

export async function generatePersistedStoryImage({
  storyId,
  supabase,
  userId,
}: {
  storyId: string
  supabase: ServerSupabase
  userId: string
}) {
  return runAiGenerationOnce({
    key: `story:image:${storyId}`,
    kind: 'story_image',
    resolveExisting: async (row) => {
      if (!row.result_story_id) {
        return null
      }

      return getPersistedStory({ storyId: row.result_story_id, supabase })
    },
    run: async () => {
      const { data: storyRow, error: storyError } = await supabase
        .from('stories')
        .select()
        .eq('id', storyId)
        .single()

      if (storyError) {
        throw new StoryServiceError(storyError.message, storyError.code === 'PGRST116' ? 404 : 500)
      }

      if (storyRow.story_image_path) {
        return {
          result: await toStoryResponse({ row: storyRow, supabase }),
          resultStoryId: storyId,
        }
      }

      const blueprint = StoryBlueprint.parse(storyRow.blueprint)
      const imageBase64 = await generateStoryImage(blueprint)
      const storyImagePath = `${userId}/stories/${storyId}/banner.png`

      await uploadBase64Image({
        base64: imageBase64,
        path: storyImagePath,
        supabase,
      })

      const { error: assetError } = await supabase.from('generated_assets').insert({
        bucket: GENERATED_ASSETS_BUCKET,
        kind: 'story_image',
        metadata: { promptType: 'storyImage' },
        path: storyImagePath,
        story_id: storyId,
        user_id: userId,
      })

      if (assetError) {
        throw new StoryServiceError(assetError.message)
      }

      const { data: updatedStoryRow, error: updateStoryError } = await supabase
        .from('stories')
        .update({ story_image_path: storyImagePath })
        .eq('id', storyId)
        .select()
        .single()

      if (updateStoryError) {
        throw new StoryServiceError(updateStoryError.message)
      }

      return {
        result: await toStoryResponse({ row: updatedStoryRow, supabase }),
        resultStoryId: storyId,
      }
    },
    supabase,
    userId,
  })
}

export async function getPersistedStory({
  storyId,
  supabase,
}: {
  storyId: string
  supabase: ServerSupabase
}) {
  const { data: row, error } = await supabase.from('stories').select().eq('id', storyId).single()

  if (error) {
    throw new StoryServiceError(error.message, error.code === 'PGRST116' ? 404 : 500)
  }

  return toStoryResponse({ row, supabase })
}

export async function listPersistedStories({ supabase }: { supabase: ServerSupabase }) {
  const { data: rows, error } = await supabase
    .from('stories')
    .select()
    .order('updated_at', { ascending: false })

  if (error) {
    throw new StoryServiceError(error.message)
  }

  const stories = await Promise.all(
    (rows ?? []).map((row) => toStoryResponse({ row, supabase })),
  )

  return { stories }
}

export async function updatePersistedStoryStatus({
  status,
  storyId,
  supabase,
}: {
  status: StoryStatus
  storyId: string
  supabase: ServerSupabase
}) {
  const { data: row, error } = await supabase
    .from('stories')
    .update({ status })
    .eq('id', storyId)
    .select()
    .single()

  if (error) {
    throw new StoryServiceError(error.message, error.code === 'PGRST116' ? 404 : 500)
  }

  return toStoryResponse({ row, supabase })
}

export async function deletePersistedStory({
  storyId,
  supabase,
}: {
  storyId: string
  supabase: ServerSupabase
}) {
  const { data: storyRow, error: storyError } = await supabase
    .from('stories')
    .select('id, story_image_path')
    .eq('id', storyId)
    .single()

  if (storyError) {
    throw new StoryServiceError(storyError.message, storyError.code === 'PGRST116' ? 404 : 500)
  }

  const { data: questRows, error: questError } = await supabase
    .from('quests')
    .select('result_image_path')
    .eq('story_id', storyId)

  if (questError) {
    throw new StoryServiceError(questError.message)
  }

  const storagePaths = [
    storyRow.story_image_path,
    ...(questRows ?? []).map((quest) => quest.result_image_path),
  ].filter((path): path is string => Boolean(path))

  const { error: deleteError } = await supabase.from('stories').delete().eq('id', storyId)

  if (deleteError) {
    throw new StoryServiceError(deleteError.message)
  }

  if (storagePaths.length) {
    const { error: storageError } = await supabase.storage
      .from(GENERATED_ASSETS_BUCKET)
      .remove(storagePaths)

    if (storageError) {
      console.warn('Story storage cleanup failed after deleting story.', storageError)
    }
  }
}

export async function getStorySession({
  storyId,
  supabase,
}: {
  storyId: string
  supabase: ServerSupabase
}) {
  const story = await getPersistedStory({ storyId, supabase })
  const { data: questRows, error } = await supabase
    .from('quests')
    .select()
    .eq('story_id', storyId)
    .order('sequence_number', { ascending: false })

  if (error) {
    throw new StoryServiceError(error.message)
  }

  const allQuests = await Promise.all(
    (questRows ?? []).map((row) => toQuestResponse({ row, supabase })),
  )
  const recentQuests = allQuests.slice(0, 10)
  const storyBeats = allQuests
    .filter((quest) => quest.resultText)
    .slice()
    .reverse()

  return {
    latestQuest: allQuests[0] ?? null,
    progress: getStoryProgress(allQuests),
    recentQuests,
    storyBeats,
    story,
  }
}

export async function createPersistedQuest({
  storyId,
  supabase,
}: {
  storyId: string
  supabase: ServerSupabase
}) {
  const { data: storyRow, error: storyError } = await supabase
    .from('stories')
    .select()
    .eq('id', storyId)
    .single()

  if (storyError) {
    throw new StoryServiceError(storyError.message, storyError.code === 'PGRST116' ? 404 : 500)
  }

  const story = mapStoryRow(storyRow, null)
  assertStoryCanReceiveQuest(story)
  const { data: latestQuestRow, error: latestQuestError } = await supabase
    .from('quests')
    .select()
    .eq('story_id', storyId)
    .order('sequence_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestQuestError) {
    throw new StoryServiceError(latestQuestError.message)
  }

  if (latestQuestRow?.status === 'proposed' || latestQuestRow?.status === 'accepted') {
    return toQuestResponse({ row: latestQuestRow, supabase })
  }

  const sequenceNumber = (latestQuestRow?.sequence_number ?? 0) + 1
  return runAiGenerationOnce({
    key: `quest:create:${storyId}:after:${latestQuestRow?.id ?? 'start'}:${latestQuestRow?.status ?? 'none'}`,
    kind: 'quest_proposal',
    resolveExisting: async (row) => {
      if (!row.result_quest_id) {
        return null
      }

      return getPersistedQuest({ questId: row.result_quest_id, supabase })
    },
    run: async () => {
      const recentQuestRows = await getRecentQuestRows({ storyId, supabase })
      const continuityContext = formatContinuityContext(recentQuestRows)
      const recommendedTask = await generateRecommendedTask({ continuityContext, story })
      const quest = await generateQuest({ continuityContext, recommendedTask, story })

      const { data: questRow, error: insertQuestError } = await supabase
        .from('quests')
        .insert({
          quest: quest as unknown as Json,
          recommended_task: recommendedTask as unknown as Json,
          sequence_number: sequenceNumber,
          status: 'proposed',
          story_id: storyId,
        })
        .select()
        .single()

      if (insertQuestError) {
        throw new StoryServiceError(insertQuestError.message)
      }

      return {
        result: await toQuestResponse({ row: questRow, supabase }),
        resultQuestId: questRow.id,
      }
    },
    supabase,
    userId: storyRow.user_id,
  })
}

export async function getPersistedQuest({
  questId,
  supabase,
}: {
  questId: string
  supabase: ServerSupabase
}) {
  const { data: row, error } = await supabase.from('quests').select().eq('id', questId).single()

  if (error) {
    throw new StoryServiceError(error.message, error.code === 'PGRST116' ? 404 : 500)
  }

  return toQuestResponse({ row, supabase })
}

export async function acceptPersistedQuest({
  questId,
  supabase,
}: {
  questId: string
  supabase: ServerSupabase
}) {
  const { data: row, error } = await supabase
    .from('quests')
    .select()
    .eq('id', questId)
    .single()

  if (error) {
    throw new StoryServiceError(error.message, error.code === 'PGRST116' ? 404 : 500)
  }

  if (row.status !== 'proposed') {
    throw new StoryServiceError('Only proposed quests can be accepted.', 409)
  }

  const { data: updatedRow, error: updateError } = await supabase
    .from('quests')
    .update({ accepted_at: new Date().toISOString(), status: 'accepted' })
    .eq('id', questId)
    .select()
    .single()

  if (updateError) {
    throw new StoryServiceError(updateError.message, updateError.code === 'PGRST116' ? 404 : 500)
  }

  return toQuestResponse({ row: updatedRow, supabase })
}

export async function completePersistedQuest({
  feedback,
  outcomeStatus,
  questId,
  supabase,
}: {
  feedback: QuestFeedback
  outcomeStatus: QuestOutcomeStatus
  questId: string
  supabase: ServerSupabase
}) {
  const { data: existingQuestRow, error: questError } = await supabase
    .from('quests')
    .select()
    .eq('id', questId)
    .single()

  if (questError) {
    throw new StoryServiceError(questError.message, questError.code === 'PGRST116' ? 404 : 500)
  }

  if (existingQuestRow.result_text && existingQuestRow.outcome_status === outcomeStatus) {
    return toQuestResponse({ row: existingQuestRow, supabase })
  }

  if (existingQuestRow.status !== 'accepted') {
    throw new StoryServiceError('Only accepted quests can be completed.', 409)
  }

  const { data: storyRow, error: storyError } = await supabase
    .from('stories')
    .select()
    .eq('id', existingQuestRow.story_id)
    .single()

  if (storyError) {
    throw new StoryServiceError(storyError.message, storyError.code === 'PGRST116' ? 404 : 500)
  }

  const story = mapStoryRow(storyRow, null)
  assertStoryCanReceiveQuest(story)
  const recommendedTask = RecommendedTask.parse(existingQuestRow.recommended_task)
  const quest = Quest.parse(existingQuestRow.quest)
  return runAiGenerationOnce({
    key: `quest:complete:${questId}:${outcomeStatus}`,
    kind: 'quest_result_text',
    resolveExisting: async (row) => {
      if (!row.result_quest_id) {
        return null
      }

      return getPersistedQuest({ questId: row.result_quest_id, supabase })
    },
    run: async () => {
      const recentQuestRows = await getRecentQuestRows({ storyId: story.id, supabase })
      const continuityContext = formatContinuityContext(
        recentQuestRows.filter((row) => row.id !== questId),
      )
      const resultText = await generateQuestResultText({
        continuityContext,
        feedback,
        outcomeStatus,
        quest,
        recommendedTask,
        story,
      })
      const completedAt = new Date().toISOString()
      const { data: completedQuestRow, error: updateError } = await supabase
        .from('quests')
        .update({
          completed_at: completedAt,
          feedback: feedback as unknown as Json,
          outcome_status: outcomeStatus,
          result_text: resultText as unknown as Json,
          status: outcomeStatus,
        })
        .eq('id', questId)
        .select()
        .single()

      if (updateError) {
        throw new StoryServiceError(updateError.message)
      }

      return {
        result: await toQuestResponse({ row: completedQuestRow, supabase }),
        resultQuestId: questId,
      }
    },
    supabase,
    userId: storyRow.user_id,
  })
}

export async function generatePersistedQuestResultImage({
  questId,
  supabase,
  userId,
}: {
  questId: string
  supabase: ServerSupabase
  userId: string
}) {
  return runAiGenerationOnce({
    key: `quest:image:${questId}`,
    kind: 'quest_result_image',
    resolveExisting: async (row) => {
      if (!row.result_quest_id) {
        return null
      }

      return getPersistedQuest({ questId: row.result_quest_id, supabase })
    },
    run: async () => {
      const { data: questRow, error: questError } = await supabase
        .from('quests')
        .select()
        .eq('id', questId)
        .single()

      if (questError) {
        throw new StoryServiceError(questError.message, questError.code === 'PGRST116' ? 404 : 500)
      }

      if (questRow.result_image_path) {
        return {
          result: await toQuestResponse({ row: questRow, supabase }),
          resultQuestId: questId,
        }
      }

      if (!questRow.result_text || !questRow.outcome_status) {
        throw new StoryServiceError('Quest result text is required before generating an image.', 409)
      }

      const { data: storyRow, error: storyError } = await supabase
        .from('stories')
        .select()
        .eq('id', questRow.story_id)
        .single()

      if (storyError) {
        throw new StoryServiceError(storyError.message, storyError.code === 'PGRST116' ? 404 : 500)
      }

      const story = mapStoryRow(storyRow, null)
      const quest = Quest.parse(questRow.quest)
      const resultText = QuestResultText.parse(questRow.result_text)
      const outcomeStatus = questRow.outcome_status
      const resultImagePath = `${userId}/stories/${story.id}/quests/${questId}/result.png`
      const imageBase64 = await generateQuestResultImage({
        outcomeStatus,
        quest,
        resultText,
        story,
      })

      await uploadBase64Image({
        base64: imageBase64,
        path: resultImagePath,
        supabase,
      })

      const { error: assetError } = await supabase.from('generated_assets').insert({
        bucket: GENERATED_ASSETS_BUCKET,
        kind: 'quest_result_image',
        metadata: { promptType: 'questResultImage' },
        path: resultImagePath,
        quest_id: questId,
        story_id: story.id,
        user_id: userId,
      })

      if (assetError) {
        throw new StoryServiceError(assetError.message)
      }

      const { data: questRowWithImage, error: imageUpdateError } = await supabase
        .from('quests')
        .update({ result_image_path: resultImagePath })
        .eq('id', questId)
        .select()
        .single()

      if (imageUpdateError) {
        throw new StoryServiceError(imageUpdateError.message)
      }

      return {
        result: await toQuestResponse({ row: questRowWithImage, supabase }),
        resultQuestId: questId,
      }
    },
    supabase,
    userId,
  })
}

export async function rejectPersistedQuest({
  feedback,
  questId,
  supabase,
}: {
  feedback: QuestFeedback
  questId: string
  supabase: ServerSupabase
}) {
  const { data: row, error } = await supabase
    .from('quests')
    .select()
    .eq('id', questId)
    .single()

  if (error) {
    throw new StoryServiceError(error.message, error.code === 'PGRST116' ? 404 : 500)
  }

  if (row.status !== 'proposed') {
    throw new StoryServiceError('Only proposed quests can be rejected.', 409)
  }

  const { data: storyRow, error: storyError } = await supabase
    .from('stories')
    .select()
    .eq('id', row.story_id)
    .single()

  if (storyError) {
    throw new StoryServiceError(storyError.message, storyError.code === 'PGRST116' ? 404 : 500)
  }

  assertStoryCanReceiveQuest(mapStoryRow(storyRow, null))

  const { data: updatedRow, error: updateError } = await supabase
    .from('quests')
    .update({
      completed_at: new Date().toISOString(),
      feedback: feedback as unknown as Json,
      outcome_status: 'rejected',
      status: 'rejected',
    })
    .eq('id', questId)
    .select()
    .single()

  if (updateError) {
    throw new StoryServiceError(updateError.message, updateError.code === 'PGRST116' ? 404 : 500)
  }

  return toQuestResponse({ row: updatedRow, supabase })
}

async function getPriorStoryContext({
  supabase,
  userId,
}: {
  supabase: ServerSupabase
  userId: string
}) {
  const { data: rows, error } = await supabase
    .from('stories')
    .select('blueprint, challenge, goal')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(6)

  if (error) {
    throw new StoryServiceError(error.message)
  }

  return formatPriorStoryContext(rows ?? [])
}

function formatPriorStoryContext(
  rows: Array<{
    blueprint: Json | null
    challenge: string
    goal: string
  }>,
) {
  const lines = rows.flatMap((row, index) => {
    const parsed = StoryBlueprint.safeParse(row.blueprint)

    if (!parsed.success) {
      return []
    }

    const blueprint = parsed.data
    return [
      [
        `Story ${index + 1}:`,
        `goal="${row.goal}"`,
        `challenge="${row.challenge}"`,
        `title="${blueprint.title}"`,
        `blurb="${blueprint.storyBlurb}"`,
        `hero="${blueprint.metaphors.hero}"`,
        `enemy="${blueprint.metaphors.enemy}"`,
        `reward="${blueprint.metaphors.reward}"`,
      ].join(' '),
    ]
  })

  if (!lines.length) {
    return '- No previous stories yet.'
  }

  return lines.map((line) => `- ${line}`).join('\n')
}

async function generateStoryBlueprint({
  challenge,
  goal,
  name,
  priorStoryContext,
}: {
  challenge: string
  goal: string
  name: string
  priorStoryContext: string
}) {
  if (shouldMock('storyBlueprint')) {
    return readMockData(StoryBlueprint, 'storyBlueprint')
  }

  return generateData(
    createStoryBlueprintPrompt({ challenge, goal, name, priorStoryContext }),
    StoryBlueprint,
  )
}

async function generateStoryImage(blueprint: IStoryBlueprint) {
  if (shouldMock('image')) {
    return readMockImage()
  }

  const image = await generateImage(createStoryImagePrompt(blueprint))
  if (!image.b64Json) {
    throw new StoryServiceError('Story image generation did not return image data.')
  }
  return image.b64Json
}

async function generateRecommendedTask({
  continuityContext,
  story,
}: {
  continuityContext: string
  story: PersistedStory
}) {
  if (shouldMock('recommendedTask')) {
    return readMockData(RecommendedTask, 'recommendedTask')
  }

  return generateData(
    createRecommendedTaskPrompt({
      challenge: story.challenge,
      continuityContext,
      goal: story.goal,
      name: story.name,
      storyBlueprint: story.blueprint,
    }),
    RecommendedTask,
  )
}

async function generateQuest({
  continuityContext,
  recommendedTask,
  story,
}: {
  continuityContext: string
  recommendedTask: IRecommendedTask
  story: PersistedStory
}) {
  if (shouldMock('quest')) {
    return readMockData(Quest, 'quest')
  }

  return generateData(
    createQuestPrompt({
      challenge: story.challenge,
      continuityContext,
      goal: story.goal,
      name: story.name,
      storyBlueprint: story.blueprint,
      task: recommendedTask,
    }),
    Quest,
  )
}

async function generateQuestResultText({
  continuityContext,
  feedback,
  outcomeStatus,
  quest,
  recommendedTask,
  story,
}: {
  continuityContext: string
  feedback: QuestFeedback
  outcomeStatus: QuestOutcomeStatus
  quest: IQuest
  recommendedTask: IRecommendedTask
  story: PersistedStory
}) {
  if (shouldMock('questResultText')) {
    return readMockData(QuestResultText, 'questResultText')
  }

  return generateData(
    createQuestResultTextPrompt({
      challenge: story.challenge,
      continuityContext,
      feedback,
      goal: story.goal,
      name: story.name,
      outcomeStatus,
      quest,
      storyBlueprint: story.blueprint,
      task: recommendedTask,
    }),
    QuestResultText,
  )
}

async function generateQuestResultImage({
  outcomeStatus,
  quest,
  resultText,
  story,
}: {
  outcomeStatus: QuestOutcomeStatus
  quest: IQuest
  resultText: IQuestResultText
  story: PersistedStory
}) {
  if (shouldMock('image')) {
    return readMockImage()
  }

  const image = await generateImage(
    createQuestResultImagePrompt({
      outcomeStatus,
      quest,
      resultText,
      storyBlueprint: story.blueprint,
    }),
  )
  if (!image.b64Json) {
    throw new StoryServiceError('Quest result image generation did not return image data.')
  }
  return image.b64Json
}

async function uploadBase64Image({
  base64,
  path,
  supabase,
}: {
  base64: string
  path: string
  supabase: ServerSupabase
}) {
  const { error } = await supabase.storage
    .from(GENERATED_ASSETS_BUCKET)
    .upload(path, base64ToUint8Array(base64), {
      contentType: 'image/png',
      upsert: true,
    })

  if (error) {
    throw new StoryServiceError(error.message)
  }
}

async function createSignedUrl(path: string | null, supabase: ServerSupabase) {
  if (!path) {
    return null
  }

  const { data, error } = await supabase.storage
    .from(GENERATED_ASSETS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

  if (error) {
    throw new StoryServiceError(error.message)
  }

  return data.signedUrl
}

async function toStoryResponse({
  row,
  supabase,
}: {
  row: {
    blueprint: Json | null
    challenge: string
    goal: string
    id: string
    name: string
    status: PersistedStory['status']
    story_image_path: string | null
    updated_at: string
  }
  supabase: ServerSupabase
}): Promise<PersistedStory> {
  return mapStoryRow(row, await createSignedUrl(row.story_image_path, supabase))
}

async function toQuestResponse({
  row,
  supabase,
}: {
  row: {
    accepted_at: string | null
    completed_at: string | null
    feedback: Json
    id: string
    outcome_status: QuestOutcomeStatus | null
    quest: Json | null
    recommended_task: Json | null
    result_image_path: string | null
    result_text: Json | null
    sequence_number: number
    status: PersistedQuest['status']
    story_id: string
  }
  supabase: ServerSupabase
}): Promise<PersistedQuest> {
  return mapQuestRow(row, await createSignedUrl(row.result_image_path, supabase))
}

function mapStoryRow(
  row: {
    blueprint: Json | null
    challenge: string
    goal: string
    id: string
    name: string
    status: PersistedStory['status']
    story_image_path: string | null
    updated_at: string
  },
  storyImageUrl: string | null,
): PersistedStory {
  return {
    blueprint: StoryBlueprint.parse(row.blueprint),
    challenge: row.challenge,
    goal: row.goal,
    id: row.id,
    name: row.name,
    status: row.status,
    storyImagePath: row.story_image_path,
    storyImageUrl,
    updatedAt: row.updated_at,
  }
}

function mapQuestRow(
  row: {
    accepted_at: string | null
    completed_at: string | null
    feedback: Json
    id: string
    outcome_status: QuestOutcomeStatus | null
    quest: Json | null
    recommended_task: Json | null
    result_image_path: string | null
    result_text: Json | null
    sequence_number: number
    status: PersistedQuest['status']
    story_id: string
  },
  resultImageUrl: string | null,
): PersistedQuest {
  return {
    acceptedAt: row.accepted_at,
    completedAt: row.completed_at,
    feedback: parseFeedback(row.feedback),
    id: row.id,
    outcomeStatus: row.outcome_status,
    quest: Quest.parse(row.quest),
    recommendedTask: RecommendedTask.parse(row.recommended_task),
    resultImagePath: row.result_image_path,
    resultImageUrl,
    resultText: row.result_text ? QuestResultText.parse(row.result_text) : null,
    sequenceNumber: row.sequence_number,
    status: row.status,
    storyId: row.story_id,
  }
}

function parseFeedback(value: Json): QuestFeedback {
  return typeof value === 'object' && value && !Array.isArray(value)
    ? { note: typeof value.note === 'string' ? value.note : undefined }
    : {}
}

function assertStoryCanReceiveQuest(story: PersistedStory) {
  if (story.status !== ACTIVE_STORY_STATUS) {
    throw new StoryServiceError('Only active stories can receive new quest updates.', 409)
  }
}

async function getRecentQuestRows({
  storyId,
  supabase,
}: {
  storyId: string
  supabase: ServerSupabase
}) {
  const { data, error } = await supabase
    .from('quests')
    .select()
    .eq('story_id', storyId)
    .order('sequence_number', { ascending: false })
    .limit(6)

  if (error) {
    throw new StoryServiceError(error.message)
  }

  return data ?? []
}

function getStoryProgress(recentQuests: PersistedQuest[]): StoryProgress {
  const counts: StoryProgress['counts'] = {
    accepted: 0,
    completed: 0,
    proposed: 0,
    rejected: 0,
    unresolved: 0,
  }

  for (const quest of recentQuests) {
    counts[quest.status] += 1
  }

  const latestQuest = recentQuests[0] ?? null
  const currentQuest =
    latestQuest && (latestQuest.status === 'proposed' || latestQuest.status === 'accepted')
      ? latestQuest
      : null
  const nextAction = getNextAction(latestQuest)

  return {
    counts,
    currentQuest,
    latestQuestStatus: latestQuest?.status ?? null,
    nextAction,
    totalQuests: recentQuests.length,
  }
}

function getNextAction(latestQuest: PersistedQuest | null): StoryProgress['nextAction'] {
  if (!latestQuest) {
    return 'start_first_quest'
  }

  if (latestQuest.status === 'proposed') {
    return 'review_proposal'
  }

  if (latestQuest.status === 'accepted') {
    return 'finish_accepted_quest'
  }

  return 'get_next_quest'
}

function formatContinuityContext(
  rows: Array<{
    feedback: Json
    id: string
    outcome_status: QuestOutcomeStatus | null
    quest: Json | null
    recommended_task: Json | null
    result_text: Json | null
    sequence_number: number
    status: QuestStatus
  }>,
) {
  if (!rows.length) {
    return '- No prior quests yet.'
  }

  return rows
    .slice()
    .reverse()
    .map((row) => {
      const quest = row.quest ? Quest.safeParse(row.quest).data : null
      const task = row.recommended_task ? RecommendedTask.safeParse(row.recommended_task).data : null
      const result = row.result_text ? QuestResultText.safeParse(row.result_text).data : null
      const feedback = parseFeedback(row.feedback)
      const parts = [
        `Quest #${row.sequence_number}`,
        `status: ${row.status}`,
        row.outcome_status ? `outcome: ${row.outcome_status}` : null,
        task ? `real task: ${task.task}` : null,
        quest ? `in-world title: ${quest.quest}` : null,
        quest ? `in-world brief: ${quest.content}` : null,
        quest ? `in-world action: ${quest.action}` : null,
        quest?.metaphors.length ? `metaphor mappings: ${formatMetaphorMappings(quest.metaphors)}` : null,
        result ? `result beat: ${result.title} - ${result.text}` : null,
        result?.metaphors.length
          ? `result mappings: ${formatMetaphorMappings(result.metaphors)}`
          : null,
        feedback.note ? `user feedback: ${feedback.note}` : null,
      ].filter(Boolean)

      return `- ${parts.join('\n  ')}`
    })
    .join('\n')
}

function formatMetaphorMappings(metaphors: Array<{ metaphor: string; real: string }>) {
  return metaphors.map((metaphor) => `${metaphor.real} -> ${metaphor.metaphor}`).join('; ')
}

function base64ToUint8Array(base64: string) {
  return Uint8Array.from(Buffer.from(base64, 'base64'))
}
