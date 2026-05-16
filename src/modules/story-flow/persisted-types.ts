import type {
  IQuest,
  IQuestProposal,
  IQuestResultText,
  IRecommendedTask,
  IStoryBlueprint,
} from '#/modules/ai/schemas/metaphors'
import type { QuestFeedback, QuestOutcomeStatus } from '#/modules/story-flow/quest-outcome'

export type PersistedStory = {
  id: string
  name: string
  goal: string
  challenge: string
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  blueprint: IStoryBlueprint
  storyImagePath: string | null
  storyImageUrl: string | null
  updatedAt: string
}

export type PersistedQuest = {
  id: string
  storyId: string
  sequenceNumber: number
  status: 'proposed' | 'accepted' | 'completed' | 'unresolved' | 'rejected'
  recommendedTask: IRecommendedTask
  quest: IQuest
  acceptedAt: string | null
  outcomeStatus: QuestOutcomeStatus | null
  feedback: QuestFeedback
  resultText: IQuestResultText | null
  resultImagePath: string | null
  resultImageUrl: string | null
  completedAt: string | null
}

export type QuestStatus = PersistedQuest['status']

export type StoryProgress = {
  counts: Record<QuestStatus, number>
  currentQuest: PersistedQuest | null
  latestQuestStatus: QuestStatus | null
  nextAction: 'start_first_quest' | 'review_proposal' | 'finish_accepted_quest' | 'get_next_quest'
  totalQuests: number
}

export type StoryResponse = {
  story: PersistedStory
}

export type StoriesResponse = {
  stories: PersistedStory[]
}

export type QuestResponse = {
  quest: PersistedQuest
}

export type StorySessionResponse = {
  latestQuest: PersistedQuest | null
  progress: StoryProgress
  recentQuests: PersistedQuest[]
  storyBeats: PersistedQuest[]
  story: PersistedStory
}

export type CreateStoryRequest = {
  challenge: string
  goal: string
  name: string
}

export type CompleteQuestRequest = {
  feedback: QuestFeedback
  outcomeStatus: QuestOutcomeStatus
}

export type PersistedQuestProposal = Pick<PersistedQuest, 'id' | 'storyId' | 'sequenceNumber'> & IQuestProposal
