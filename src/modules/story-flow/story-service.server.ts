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
} from '#/modules/story-flow/persisted-types'

const GENERATED_ASSETS_BUCKET = 'generated-assets'
const SIGNED_URL_TTL_SECONDS = 60 * 60

type ServerSupabase = ReturnType<typeof createServerSupabaseClient>

export class StoryServiceError extends Error {
  constructor(
    message: string,
    public status = 500,
  ) {
    super(message)
  }
}

export async function createPersistedStory({
  challenge,
  goal,
  name,
  supabase,
  userId,
}: {
  challenge: string
  goal: string
  name: string
  supabase: ServerSupabase
  userId: string
}) {
  const storyId = crypto.randomUUID()
  const blueprint = await generateStoryBlueprint({ challenge, goal, name })
  const imageBase64 = await generateStoryImage(blueprint)
  const storyImagePath = `${userId}/stories/${storyId}/banner.png`

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

  try {
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

    return toStoryResponse({ row: updatedStoryRow, supabase })
  } catch (error) {
    await supabase.from('stories').delete().eq('id', storyId)
    throw error
  }
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

  return {
    latestQuest: allQuests[0] ?? null,
    progress: getStoryProgress(allQuests),
    recentQuests,
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
  const { data: latestQuestRow, error: latestQuestError } = await supabase
    .from('quests')
    .select('sequence_number')
    .eq('story_id', storyId)
    .order('sequence_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestQuestError) {
    throw new StoryServiceError(latestQuestError.message)
  }

  const sequenceNumber = (latestQuestRow?.sequence_number ?? 0) + 1
  const recentQuestRows = await getRecentQuestRows({ storyId, supabase })
  const recentQuestHistory = formatRecentQuestHistory(recentQuestRows)
  const recommendedTask = await generateRecommendedTask({ recentQuestHistory, story })
  const quest = await generateQuest({ recentQuestHistory, recommendedTask, story })

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

  return toQuestResponse({ row: questRow, supabase })
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
    .update({ accepted_at: new Date().toISOString(), status: 'accepted' })
    .eq('id', questId)
    .select()
    .single()

  if (error) {
    throw new StoryServiceError(error.message, error.code === 'PGRST116' ? 404 : 500)
  }

  return toQuestResponse({ row, supabase })
}

export async function completePersistedQuest({
  feedback,
  outcomeStatus,
  questId,
  supabase,
  userId,
}: {
  feedback: QuestFeedback
  outcomeStatus: QuestOutcomeStatus
  questId: string
  supabase: ServerSupabase
  userId: string
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

  const { data: storyRow, error: storyError } = await supabase
    .from('stories')
    .select()
    .eq('id', existingQuestRow.story_id)
    .single()

  if (storyError) {
    throw new StoryServiceError(storyError.message, storyError.code === 'PGRST116' ? 404 : 500)
  }

  const story = mapStoryRow(storyRow, null)
  const recommendedTask = RecommendedTask.parse(existingQuestRow.recommended_task)
  const quest = Quest.parse(existingQuestRow.quest)
  const resultText = await generateQuestResultText({
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

  try {
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

    return toQuestResponse({ row: questRowWithImage, supabase })
  } catch (error) {
    console.warn('Quest result image generation failed after text result was persisted.', error)
    return toQuestResponse({ row: completedQuestRow, supabase })
  }
}

async function generateStoryBlueprint({
  challenge,
  goal,
  name,
}: {
  challenge: string
  goal: string
  name: string
}) {
  if (shouldMock('storyBlueprint')) {
    return readMockData(StoryBlueprint, 'storyBlueprint')
  }

  return generateData(createStoryBlueprintPrompt({ challenge, goal, name }), StoryBlueprint)
}

async function generateStoryImage(blueprint: IStoryBlueprint) {
  if (shouldMock('image')) {
    return readMockImage()
  }

  const image = await generateImage(createStoryImagePrompt(blueprint))
  return image.b64Json
}

async function generateRecommendedTask({
  recentQuestHistory,
  story,
}: {
  recentQuestHistory: string
  story: PersistedStory
}) {
  if (shouldMock('recommendedTask')) {
    return readMockData(RecommendedTask, 'recommendedTask')
  }

  return generateData(
    createRecommendedTaskPrompt({
      challenge: story.challenge,
      goal: story.goal,
      name: story.name,
      recentQuestHistory,
      storyBlueprint: story.blueprint,
    }),
    RecommendedTask,
  )
}

async function generateQuest({
  recommendedTask,
  recentQuestHistory,
  story,
}: {
  recommendedTask: IRecommendedTask
  recentQuestHistory: string
  story: PersistedStory
}) {
  if (shouldMock('quest')) {
    return readMockData(Quest, 'quest')
  }

  return generateData(
    createQuestPrompt({
      challenge: story.challenge,
      goal: story.goal,
      name: story.name,
      recentQuestHistory,
      storyBlueprint: story.blueprint,
      task: recommendedTask,
    }),
    Quest,
  )
}

async function generateQuestResultText({
  feedback,
  outcomeStatus,
  quest,
  recommendedTask,
  story,
}: {
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

function formatRecentQuestHistory(
  rows: Array<{
    feedback: Json
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
    .map((row) => {
      const quest = row.quest ? Quest.safeParse(row.quest).data : null
      const task = row.recommended_task ? RecommendedTask.safeParse(row.recommended_task).data : null
      const result = row.result_text ? QuestResultText.safeParse(row.result_text).data : null
      const feedback = parseFeedback(row.feedback)
      const parts = [
        `#${row.sequence_number}`,
        `status: ${row.status}`,
        quest ? `quest: ${quest.quest}` : null,
        task ? `task: ${task.task}` : null,
        result ? `result: ${result.title}` : null,
        feedback.note ? `feedback: ${feedback.note}` : null,
      ].filter(Boolean)

      return `- ${parts.join('; ')}`
    })
    .join('\n')
}

function base64ToUint8Array(base64: string) {
  return Uint8Array.from(Buffer.from(base64, 'base64'))
}
